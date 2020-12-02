import axios, { AxiosRequestConfig } from '../..';

interface MyAxiosRequestConfig extends AxiosRequestConfig {
    withoutToken?: boolean
}

interface MyAxiosResponse<T = any> {
    code: number;
    data: T
    msg: string;
}

interface VoUserInfo {
    id: string;
    nick: string;
    age: number;
}

const config: MyAxiosRequestConfig = {
    baseURL: '/'
}

const instance = axios.create(config)

instance.interceptors.request.use(
    config => {
        if (config.withoutToken) {
            // do something...
        }
        return config;
    }
)

instance.interceptors.response.use(
    response => {
        return response.data
    }
)

function reqLogin(): Promise<MyAxiosResponse<VoUserInfo>> {
    return instance.get('/login', {
        withoutToken: true
    })
}

reqLogin().then(res => {
    const { code, data, msg } = res
    const { age, id, nick } = data
})