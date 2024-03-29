import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import AKHttp from '../../api/AKHttp';
import { url, addEchoMap } from '../../api/config'

import { Dayjs } from "dayjs";
const dayjs = require('dayjs')


import { CacheService } from '../../common/CacheService';



@Controller('shutDownDeviceWages')
export class shutDownDeviceWagesController {

    constructor(private readonly cacheService: CacheService) { }


    @Get("detail/:id")
    async detail(@Param('id') id: String) {
        const requestURL = `${url}/shutDownDeviceWages/get/${id}`
        const data = await AKHttp.get(requestURL);
        data && addEchoMap(data, {
            "planStatus": "ProductPlanStatus",
        })

        // 获取上机时间
        const userDeviceURL = `${url}/userDeviceRecord/get/detail`
        const userDevice = await AKHttp.post(userDeviceURL, {
            masterPlanId: data.planId
        });
        if (userDevice) {
            data.useDeviceTime = dayjs(userDevice.createdTime).format('YYYY-MM-DD HH:mm:ss')
        }
        if (data.startTime) {
            data.startTime = dayjs(userDevice.startTime).format('YYYY-MM-DD HH:mm:ss')
        }
        if (data.startTime) {
            data.endTime = dayjs(userDevice.endTime).format('YYYY-MM-DD HH:mm:ss')
        }

        //产品图纸
        if (data.baseProductId) {

            const drawingAdjunctsURL = `${url}/baseProductAdjunct/get/list`
            const drawingAdjuncts = await AKHttp.post(drawingAdjunctsURL, {
                productId: data.baseProductId,
                type: "DRAWING"
            });
            data.drawingAdjuncts = drawingAdjuncts
        } else {
            data.drawingAdjuncts = []
        }

        return data;
    }

    @Post("page")
    async page(@Req() request, @Body() body) {
        const data = await AKHttp.postByConifg(`${url}/shutDownDeviceWages/base/page`,
            body, {
            headers: request.headers
        });
        // 添加枚举
        data && addEchoMap(data.records, {
            "payrollStatus": "ReportWordPayrollStatusEnum",
            "shutDownReason": "StopDuringReasonEnum",
        })
        return data;
    }

    // sleep() {
    //     return new Promise((resolve) => {
    //         setTimeout(() => {
    //             resolve(1);
    //         }, 3000); // 将秒转换为毫秒
    //     })
    // }


    @Post("saveAndUpdate")
    async saveAndUpdate(@Req() request, @Body() body) {

        // // 报工人员
        // const employeeId = request.headers["Context-Employee-Id"]
        // body.reportEmployeeId = employeeId;

        const data = await AKHttp.postByConifg(`${url}/c_shut_down_device_wages/insertAndUpdate`, body, {
            headers: request.headers
        });



        return data;
    }

}