
import axios from 'axios';
import { AxiosRequestConfig } from 'axios';

import { url } from './config'
const requestUrl = url

async function get(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.log('报错请求地址: ' + url)
    const { msg, errorMsg } = error.response.data
    throw new Error(`Error fetching data: ${errorMsg || msg} ${url}`);
  }
}


async function post(url, body) {
  try {
    const response = await axios.post(url, body);
    return response.data;
  } catch (error) {
    const { msg, errorMsg } = error.response.data
    throw new Error(`${errorMsg || msg}`);
  }
}

async function postByConifg(url, body, config: AxiosRequestConfig) {
  try {
    const conf = {
      headers: {
        "TenantId": config.headers["tenantid"],
        "Token": config.headers["token"],
        "Applicationid": config.headers["applicationid"],
        "Context-User-Id": config.headers["context-user-id"],
        "Context-Employee-Id": config.headers["context-employee-id"]
      }
    }
    const response = await axios.post(url, body, conf);
    return response.data;
  } catch (error) {
    const { msg, errorMsg } = error.response.data
    console.log('报错接口', url)
    throw new Error(`${errorMsg || msg}`);
  }
}


// ==================================  二次封装方法  ===============================
async function insert(tableName, body, request) {
  return await postByConifg(`${requestUrl}/${tableName}/insert`, body, {
    headers: request.headers
  });
}
async function update(tableName, body, request) {
  return await postByConifg(`${requestUrl}/${tableName}/update`, body, {
    headers: request.headers
  });
}
async function insertAndUpdate(tableName, body, request) {
  return await postByConifg(`${requestUrl}/${tableName}/insertAndUpdate`, body, {
    headers: request.headers
  });
}

async function batchDelete(tableName, ids) {
  return await post(`${requestUrl}/${tableName}/batchDelete`, ids);
}

async function deleteFromTable(path, body) {
  return await post(`${requestUrl}/${path}/deleteFromTable`, body);
}

async function getOne(path) {
  return await get(`${requestUrl}/${path}`);
}
async function getDetail(path, idAndBody) {
  if(typeof idAndBody == 'object') {
    const body = idAndBody
    return await post(`${requestUrl}/${path}/detail`, body);
  } else {
    const id = idAndBody
    return await get(`${requestUrl}/${path}/${id}`);
  }
}
async function getCount(path, body) {
  return await post(`${requestUrl}/${path}/count`, body);
}
async function hasData(path, body) {
  return await post(`${requestUrl}/${path}/hasData`, body);
}
async function queryForList(path, body) {
  return await post(`${requestUrl}/${path}/list`, body);
}
async function queryForPageList(path, body) {
  return await post(`${requestUrl}/${path}/page`, body);
}




export default {
  get,
  post,
  postByConifg,
  // 二次封装方法
  insert,
  update,
  insertAndUpdate,
  batchDelete,
  deleteFromTable,
  getOne,
  hasData,
  getDetail,
  getCount,
  queryForList,
  queryForPageList,
}