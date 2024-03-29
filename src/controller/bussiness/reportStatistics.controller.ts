import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { url, addEchoMap } from '../../api/config'
import { Dayjs } from "dayjs";

const dayjs = require('dayjs')
const { exec } = require('child_process');

import { HttpTool } from '../../api/HttpTool';



@Controller('reportStatistics')
export class reportStatisticsController {

constructor(private readonly AKHttp: HttpTool) {}



    // 
    @Get("test")
    async test() {
        const scriptPath = 'C:/Users/Administrator/Desktop/t.bat';
        exec(scriptPath, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行错误: ${error}`);
                return;
            }

            // 输出bat脚本的标准输出结果
            console.log(`stdout: ${stdout}`);
        });
    }

    // 整体生产计划状态
    @Get("plan")
    async detail() {
        const requestURL = `${url}/statistics/plan/count`
        var now: Dayjs = dayjs()

        const timeRange = {
            createdTimeStart: now.subtract(1, 'year').valueOf(),
            createdTimeEnd: now.valueOf(),
        }
        // 待生效
        const pendingToEffect = await this.AKHttp.post(requestURL, { "planStatus": "PENDING_TO_EFFECT", ...timeRange });
        // 待派工
        const toBeProduced = await this.AKHttp.post(requestURL, { "planStatus": "TO_BE_PRODUCED", ...timeRange });
        // 生产中
        const inProgress = await this.AKHttp.post(requestURL, { "planStatus": "IN_PROGRESS", ...timeRange });
        // 生产暂停
        const stopProduction = await this.AKHttp.post(requestURL, { "planStatus": "STOP_PRODUCTION", ...timeRange });
        // 生产结束
        const productionEnd = await this.AKHttp.post(requestURL, { "planStatus": "PRODUCTION_END", ...timeRange });
        // 生产完成
        const productionCompletion = await this.AKHttp.post(requestURL, { "planStatus": "PRODUCTION_COMPLETION", ...timeRange });

        return {
            pendingToEffect,
            toBeProduced,
            inProgress,
            stopProduction,
            productionEnd,
            productionCompletion,
        };
    }

    // 全年生产产品数量情况
    @Get("reportWorkForYear")
    async reportWorkForYear() {
        const requestPlanCountURL = `${url}/statistics/reportWorkPlanCountForYear/detail`
        const requestProduceCountURL = `${url}/statistics/reportWorkProduceCountForYear/detail`
        var now: Dayjs = dayjs()

        // 获取前12个月资料
        const monthNumber = 12


        let requestTimeParams = []
        for (let i = 0; i < monthNumber; i++) {
            let curMonth = now.subtract(i, 'month')
            requestTimeParams.push({
                year: curMonth.year(),
                month: curMonth.month() + 1,
                createdTimeStart: curMonth.startOf('month').valueOf(),
                createdTimeEnd: curMonth.endOf('month').valueOf(),
            })
        }

        // 计划生产数
        const reportWorkPlanCountForYear = await Promise.all(requestTimeParams.map(timeRange => {
            return this.AKHttp.post(requestPlanCountURL, { "qualityStatus": "PASSED", ...timeRange });
        })).then((res) => {
            console.log("结果", res)
            // 填入月份
            for (let i = 0; i < monthNumber; i++) {
                res[i].year = requestTimeParams[i].year
                res[i].month = requestTimeParams[i].month
            }
            return res
        })

        // 实际生产总数
        const reportWorkProductCountForYear = await Promise.all(requestTimeParams.map(timeRange => {
            return this.AKHttp.post(requestProduceCountURL, { "qualityStatus": "PASSED", ...timeRange });
        })).then((res) => {
            console.log("结果", res)
            // 填入月份
            for (let i = 0; i < monthNumber; i++) {
                res[i].year = requestTimeParams[i].year
                res[i].month = requestTimeParams[i].month
            }
            return res
        })

        return {
            reportWorkPlanCountForYear: reportWorkPlanCountForYear.reverse(),
            reportWorkProductCountForYear: reportWorkProductCountForYear.reverse(),
        };
    }

    //设备开机率
    @Get("operatingPercentage")
    async operatingPercentage() {
        const requestURL = `${url}/statistics/operating`
        const deviceList = await this.AKHttp.get(requestURL);

        const deviceCount = deviceList.length;
        let operaNum = 0;
        let closeNum = 0;

        deviceList.forEach(item => {
            if (item.status) {
                operaNum++
            } else {
                closeNum++
            }
        })

        return {
            operaPercentage: operaNum / deviceCount,
            closePercentage: closeNum / deviceCount,
        };
    }

    //全年设备首检情况
    @Get("firstCheck")
    async firstCheck() {
        const requestURL = `${url}/statistics/firstCheck/detail`
        var now: Dayjs = dayjs()

        // 获取前12个月资料
        const monthNumber = 12

        let requestTimeParams = []
        for (let i = 0; i < monthNumber; i++) {
            let curMonth = now.subtract(i, 'month')
            requestTimeParams.push({
                year: curMonth.year(),
                month: curMonth.month() + 1,
                createdTimeStart: curMonth.startOf('month').valueOf(),
                createdTimeEnd: curMonth.endOf('month').valueOf(),
            })
        }

        const result = await Promise.all(requestTimeParams.map(timeRange => {
            return this.AKHttp.post(requestURL, timeRange);
        })).then((res) => {
            console.log("结果", res)
            // 填入月份
            for (let i = 0; i < monthNumber; i++) {
                res[i].year = requestTimeParams[i].year
                res[i].month = requestTimeParams[i].month
            }
            return res
        })

        return result.reverse();
    }


    //人员操作占比情况
    @Get("employeeReport")
    async employeeReport() {
        const requestURL = `${url}/statistics/employeeReport/count`
        var now: Dayjs = dayjs()
        const timeRange = {
            createdTimeStart: now.subtract(1, 'year').valueOf(),
            createdTimeEnd: now.valueOf(),
        }
        // 上机
        const useDevice = await this.AKHttp.post(requestURL, { "operation": "USE_DEVICE", ...timeRange });
        // 首检
        const firstCheck = await this.AKHttp.post(requestURL, { "operation": "FIRST_CHECK", ...timeRange });
        // 资料上传
        const adjustMachine = await this.AKHttp.post(requestURL, { "operation": "UPLOAD_DEVICE_DATA", ...timeRange });
        // 完结
        const finish = await this.AKHttp.post(requestURL, { "operation": "FINISH", ...timeRange });
        // 产中停
        const stopForProduction = await this.AKHttp.post(requestURL, { "operation": "STOP_FOR_PRODUCTION", ...timeRange });

        const sum = useDevice + firstCheck + adjustMachine + finish + stopForProduction

        return {
            useDevice: useDevice / sum,
            firstCheck: firstCheck / sum,
            adjustMachine: adjustMachine / sum,
            finish: finish / sum,
            stopForProduction: stopForProduction / sum,
        }
    }

}