import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import AKHttp from '../../api/AKHttp';
import AKHttpById from '../../api/AKHttpById';
import { url, addEchoMap } from '../../api/config'

const dayjs = require('dayjs')



@Controller('bom')
export class bomController {

    @Post("saveAndUpdate")
    async saveAndUpdate(@Req() request, @Body() body) {
        // 是否修改
        const isEdit = !!body.id

        // 判断商标有没有重复类型
        const trademarkNumberList = body.trademarkNumber ? body.trademarkNumber.split(",") : []

        // 新增BOM生产组件
        body.hasComponent = !!body.componentList && body.componentList.length > 0

        // 查重产品名称、产品编号, 通过产品id查重
        const hasSameNameAndCode = await AKHttp.hasData(`bom/base`,
            {
                productId: body.productId,
                excludeId: isEdit ? body.id : null
            }
        );
        if (hasSameNameAndCode) throw {message: '重复产品名称、产品编号'}

        // 新增BOM表
        const bomId = await AKHttp.insertAndUpdate(`c_bom`, body, request);

        // 清除所有 生产组件/颜色/包材
        if (isEdit) {
            await AKHttp.deleteFromTable(`bomProductionComponent/entity`, { bomId });
            await AKHttp.deleteFromTable(`bomProductionMaterial/entity`, { bomId });
        }

        if (body.hasComponent == false) {
            body.productExtend.componentId = body.productId
            body.productExtend.componentName = body.productName
            body.productExtend.componentNumber = body.productNumber
            body.componentList = [body.productExtend]
        }

        body.componentList.forEach(item => item.bomId = bomId);
        let componentIdList = await this.insertList(request, 'c_bom_production_component', body.componentList);

        // 新增BOM生产组件-颜色
        for (let index in body.componentList) {
            const component = body.componentList[index]
            const componentId = componentIdList[index]
            if (component.colorList) {
                component.colorList.forEach(item => item.bomProductionComponentId = componentId);
                await this.insertList(request, 'c_bom_production_component_color', component.colorList);
            }
        }

        // 新增BOM包材
        if (body.materialList) {
            body.materialList.forEach(item => item.bomId = bomId);
        }
        this.insertList(request, 'c_bom_production_material', body.materialList);

        return bomId;
    }

    // 批量新增
    private async insertList(request, tableName, list) {
        return new Promise(async (resolve) => {
            if (list) {
                let requestList = []
                for (let item of list) {
                    // 新增BOM生产组件
                    requestList.push(AKHttp.insert(tableName, item, request))
                }
                if (requestList.length == 0) resolve(null)
                resolve(await Promise.all(requestList));
            }
            resolve(null)
        })

    }


    @Post("removeByIds")
    async removeByIds(@Body() ids) {
        await AKHttp.batchDelete('c_bom', ids);
        return true;
    }


    @Post("queryForList")
    async queryForList(@Body() body) {
        // 模糊搜索
        if (body.model.searchValue) {
            body.model.productName = body.model.searchValue;
            body.model.productNumber = body.model.searchValue;
        }

        const bomPage = await AKHttp.queryForPageList(`bom/collect`, body);

        for (let record of bomPage.records) {
            //添加类型
            record && addEchoMap(record, {
                "productType": "BomProductType",
            })
            const bomId = record.id
            for (let component of record.componentList) {
                //添加类型
                component && addEchoMap(component, {
                    "componentType": "BOM_COMPONENT_TYPE"
                })
            }

            // 获取产品详情
            const productDetail = await AKHttp.getDetail("product/base", record.productId)


            record.productName = productDetail.name
            record.productNumber = productDetail.code
            record.weight = productDetail.weight
            record.cycle = productDetail.standardCycle
            record.productUnitPrice = productDetail.bootUnitPrice
            record.location = productDetail.warehouseId
            // 查询仓库名
            if (record.location) {
                const warehouseDetail = await AKHttp.getDetail("storageWarehouse/base", record.location)
                if (warehouseDetail) {
                    record.location = warehouseDetail.name + "/" + warehouseDetail.shelf
                }
            }
        }

        return bomPage;
    }



    @Get("detail/:id")
    async detail(@Param('id') id: String) {
        let record = await AKHttp.getDetail(`bom/get`, id);
        const bomId = record.id
        //添加类型
        record && addEchoMap(record, {
            "productType": "BomProductType",
        })
        // 获取BOM生产组件
        // record.componentList = await AKHttp.post(`bomProductionComponent/entity/list`, { bomId })
        for (let component of record.componentList) {
            //添加类型
            component && addEchoMap(component, {
                "componentType": "BOM_COMPONENT_TYPE",
            })
        }
        // BOM包材-添加类型
        record.materialList && addEchoMap(record.materialList, {
            "materialType": "BASE_ACCESSORY_MATERIAL_TYPE"
        })

        // BOM生产扩展字段
        if (record.hasComponent == false && record.componentList.length) {
            record.productExtend = record.componentList[0]
            record.componentList = []
        }

        // 获取产品详情
        const productDetail = await AKHttp.getDetail("product/base", record.productId)

        record = {
            ...record,
            productName: productDetail.name,
            productNumber: productDetail.code,
            weight: productDetail.weight,
            netWeight: productDetail.netWeight,
            cycle: productDetail.standardCycle,
            productUnitPrice: productDetail.bootUnitPrice,
            location: productDetail.warehouseId,
        }
        // 查询仓库名
        if (record.location) {
            const warehouseDetail = await AKHttp.getDetail("storageWarehouse/base", record.location)
            if (warehouseDetail) {
                record.location = warehouseDetail.name + "/" + warehouseDetail.shelf
            }
        }



        return record;
    }
}