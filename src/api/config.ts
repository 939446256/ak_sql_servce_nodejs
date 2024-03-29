import axios from 'axios';
import environment from '../../environment';
const config = environment.currentEnv();
export let url = config.baseUrl + ':8810/base';
export let urlById = config.baseUrl + ':8810/baseById';
export let baseUrl = config.baseUrl;



// 注入echo对象
export function addEchoMap(target, echoMap) {
    let transLateFun = (record) =>{
        record.echoMap = {}
        Object.keys(echoMap).forEach(key => {
            const value = record[key];
            const enumName = echoMap[key]
            record.echoMap[key] = findEnum(enumName, value)
        })
    }

    if(Array.isArray(target)){
        target.forEach(record => {
            transLateFun(record)
        });
    } else {
        transLateFun(target)
    }
}

//枚举
export function resetEnum() {
    axios.post(`${config.baseUrl}:19760/anyTenant/enums/findEnumListByType`, [
        { "type": "ReportWordPayrollStatusEnum" },
        { "type": "ProductPlanStatus" },
        { "type": "StopDuringReasonEnum" },
        { "type": "BomProductType" },
        { "type": "OrderStatus" },
        { "type": "ProductionPlanPriority" },
        { "type": "OrderSourceEnum" },
        { "type": "OrderTypeEnum" },
    ]).then(res => {
        bussinessEnum.data = res.data.data
    })
}
resetEnum()

//字典
export function resetDict() {
    axios.post(`${config.baseUrl}:19760/anyUser/dict/findDictMapItemListByKey`, [
        { "type": "BOM_COMPONENT_TYPE" },
        { "type": "BASE_ACCESSORY_MATERIAL_TYPE" },
    ]).then(res => {
        bussinessDict.data = res.data.data
    })
}
resetDict()


let bussinessEnum = {
    data: {}
}

let bussinessDict = {
    data: {}
}

function findEnum(name, value) {
    if (bussinessEnum.data[name]) {
        for (let element of bussinessEnum.data[name]) {
            if (element.value == value) {
                return element.label
            }
        }
    }
    else if (bussinessDict.data[name]) {
        for (let element of bussinessDict.data[name]) {
            if (element.value == value) {
                return element.label
            }
        }
    }
    return null
}



