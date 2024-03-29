import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import AKHttp from '../../api/AKHttp';
import { url, baseUrl, addEchoMap } from '../../api/config'

import { Dayjs } from "dayjs";

const dayjs = require('dayjs')


@Controller('order')
export class orderController {

    @Post("saveAndUpdate")
    async saveAndUpdate(@Req() request, @Body() body) {
        // 是否修改
        const isEdit = !!body.id
        if (isEdit) {
            // 判断生成的计划是否已经在生产
            const masterPlanList = await AKHttp.queryForList(`masterProductionPlan/get`,
                { orderId: body.id, NotPlanStatus: "PENDING_TO_EFFECT" }
            )
            if (masterPlanList.length > 0) {
                throw new Error("已经有生产中计划,不允许修改")
            }
            for (let item of masterPlanList) {
                const stopCountRecord = await AKHttp.getCount(`masterProductionPlan/get`,
                    { masterPlanId: item.id }
                )
                if (stopCountRecord > 0) {
                    throw new Error("该订单已进入生产,不允许修改")
                }
            }
        }
        else {
            const code = await this.generateMasterPlanCode()
            body.code = code
        }
        // 新增订单, 默认待生产
        body.status = "TO_BE_PRODUCED"
        const orderId = await AKHttp.insertAndUpdate(`c_order`, body, request);
        // 新增订单详情
        body.orderId = orderId
        body.id = null
        await AKHttp.insertAndUpdate(`c_order_detail`, body, request);
        // 新建生产计划
        if (isEdit == false) {
            // bom详情
            const bomDetail = await AKHttp.getDetail(`bom/get`, { id: body.bomId });
            // bom表组件列表
            const bomProductionComponentList = await AKHttp.queryForList(`bomProductionComponent/entity`, { bomId: body.bomId });

            // 商标
            const trademarkNumberList = bomDetail.trademarkNumber ? bomDetail.trademarkNumber.split(",") : []
            const brandList = []
            // 获取商标
            for (let trademarkNumber of trademarkNumberList) {
                const baseAccessoryBrand = await AKHttp.getDetail(`baseAccessoryBrand/get`, { id: trademarkNumber });
                if (baseAccessoryBrand) {
                    brandList.push({
                        "baseBrandId": baseAccessoryBrand.id,
                        "amount": body.totalProductionQuantity
                    })
                }
            }


            // 根据组件生成计划
            const componentList = []
            for (let bomProductionComponent of bomProductionComponentList) {
                // 组件ID
                const componentId = bomProductionComponent.componentId
                // 组件用量
                const componentDosage = bomProductionComponent.componentDosage
                // 产品数量
                const totalProductionQuantity = body.totalProductionQuantity
                const baseUnitProduction = totalProductionQuantity * componentDosage

                const bomProductionMaterialList = await AKHttp.queryForList(`bomProductionMaterial/entity`, { bomId: body.bomId });
                const addPlanParam = {
                    orderId,
                    "bomId": body.bomId,
                    "productInfo": {
                        "baseProductId": componentId,
                        "amount": baseUnitProduction
                    },
                    "brandList": brandList,
                    "materialList": bomProductionMaterialList.map(item => ({
                        "baseMaterialId": item.materialId,
                        "bomMaterialAmount": item.amount
                    }))
                }
                componentList.push(addPlanParam)
            }

            try {
                await AKHttp.postByConifg(`${baseUrl}:19760/masterProductionPlan/save`, componentList, { headers: request.headers });
            } catch (err) {
                // 删除刚提交的订单
                if (isEdit == false && orderId) {
                    AKHttp.deleteFromTable(`order/base`, { id: orderId });
                    AKHttp.deleteFromTable(`orderDetail/base`, { orderId });
                }
                throw {
                    message: err.stack
                };
            }
        }


        return orderId;
    }

    private async generateMasterPlanCode() {
        var now: Dayjs = dayjs()
        let code = "D" + now.format('YYYYMMDD');
        const orderDetail = await AKHttp.getDetail(`order/get`, { code });
        if (orderDetail) {
            let lastNumber = Number(orderDetail.code.slice(-3))
            lastNumber += 1;
            return code + lastNumber.toString().padStart(3, '0')
        } else {
            return code + "001"
        }
    }


    @Post("queryForList")
    async queryForList(@Body() body) {
        if (body.model.searchValue) {
            body.model.code = body.model.searchValue;
            body.model.bomProductName = body.model.searchValue;
        }
        const recordList = await AKHttp.queryForPageList(`order/query`, body);
        for (let item of recordList.records) {
            item && addEchoMap(item, {
                "orderSource": "OrderSourceEnum",
                "priority": "ProductionPlanPriority",
                "status": "OrderStatus",
                "type": "OrderTypeEnum",
            })
        }
        return recordList;
    }


    @Get("detail/:id")
    async detail(@Param('id') id: String) {
        const record = await AKHttp.getDetail(`order/get`, id);
        // const bomId = record.id
        // //添加类型
        record && addEchoMap(record, {
            "orderSource": "OrderSourceEnum",
            "priority": "ProductionPlanPriority",
            "status": "OrderStatus",
            "type": "OrderTypeEnum",
        })
        const connMasterPlanList = []
        if (record.connMasterPlanId) {
            const idList = record.connMasterPlanId.split(",")
            const codeList = record.connMasterPlanCode.split(",")
            for (let i = 0; i < idList.length; i++) {
                const id = idList[i]
                const code = codeList[i]
                connMasterPlanList.push({ id, code })
            }
        }
        record.connMasterPlanList = connMasterPlanList


        const productComponentList = []
        if (record.productComponentId) {
            const idList = record.productComponentId.split(",")
            const codeList = record.productComponentCode.split(",")
            for (let i = 0; i < idList.length; i++) {
                const id = idList[i]
                const code = codeList[i]
                productComponentList.push({ id, code })
            }
        }
        record.productComponentList = productComponentList
        return record;
    }
}