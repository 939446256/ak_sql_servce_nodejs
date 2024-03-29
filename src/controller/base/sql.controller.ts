
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import AKHttp from '../../api/AKHttp';
import {url} from '../../api/config'

export interface Movie {
  id: number;
  name: string;
  year: number;
}


@Controller("adminNodejs")
export class SqlController {

  
  @Get(":model/:io")
  async getData(
    @Param('model') _model: string,
    @Param('io') _io: string,
  ): Promise<any> {
    const data = await AKHttp.get(`${url}/${_model}/${_io}`);
    return data;
  }

  
  @Get(":model/:io/:id")
  async getDataById(
    @Param('model') _model: string,
    @Param('io') _io: string,
    @Param('id') _id: string,
  ): Promise<any> {
    const data = await AKHttp.get(`${url}/${_model}/${_io}/${_id}`);
    return data;
  }
  
  @Post(":model/:io")
  async postData(
    @Param('model') _model: string,
    @Param('io') _io: string,
    @Body() body
  ): Promise<any> {
    const data = await AKHttp.post(`${url}/${_model}/${_io}`, body);
    return data;
  }

  
  @Post(":model/:io/page")
  async postPageData(
    @Param('model') _model: string,
    @Param('io') _io: string,
    @Body() body
  ): Promise<any> {
    const data = await AKHttp.post(`${url}/${_model}/${_io}/page`, body);
    return data;
  }
  
  @Post(":model/:io/count")
  async count(
    @Param('model') _model: string,
    @Param('io') _io: string,
    @Body() body
  ): Promise<any> {
    const data = await AKHttp.post(`${url}/${_model}/${_io}/count`, body);
    return data;
  }



  @Post("translateRequestParams")
  translateRequestParams(@Body() body ) : any{
    let SQLAssociativeTable = []
      let fieldList = []
      // const showTableDetail = JSON.parse(JSON.stringify(this.showTableDetail))
      let showTableDetail = typeof body.data == 'string' ? JSON.parse(body.data) : body.data
      let classAnntations = typeof body.classAnntations == 'string' ? JSON.parse(body.classAnntations) : body.classAnntations
      showTableDetail.forEach(table => {
        // 添加所有关联表
        const nickName = table.nickName ? " " + table.nickName : ""
        const customAssociative = table.customAssociative ? " " + table.customAssociative : ""
        SQLAssociativeTable.push(table.name + nickName + customAssociative)
        // 将所有表的字段取出
        for (const field of table.value) {
          field.annotation = {
            "SQLTableNick": nickName ? nickName : table.name,
          }
          field.annotationAry.forEach(item => {
            // 判断是否数组
            if(Array.isArray(item.value)){
              field.annotation[item.name] = item.value.join(",")
            } else {
              field.annotation[item.name] = item.value
            }
          })
          field.typeName = field.type
          fieldList.push(field)
        }
      })
      const annotation = {
        "SQLAssociativeTable": SQLAssociativeTable
      }
      if(classAnntations){
        for(let classAnntation of classAnntations){
          annotation[classAnntation.name] = classAnntation.value
        }
      }
      // this.classAnntations.forEach(item => {
      //   annotation[item.name] = item.value
      // })


      var params = {
        "annotation": annotation,
        "fieldList": fieldList,
        "requestParams": {}
      }
      return params;
  }
}