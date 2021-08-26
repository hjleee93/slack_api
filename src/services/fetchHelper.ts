import { service } from '../commons/globals';


async function refreshAccessToken() {
    const response = await fetch('http://localhost:8088/api/v1/refresh-token', {
        headers: {
            Authorization: `Bearer ${service.refresh_token}`
        }
    })
    const json: any = response.json();
    if( json.data && json.data.access_token ) {
        service.access_token = json.data.access_token;
    }
}

export const fetchHelper = async (input: RequestInfo, init?: RequestInit): Promise<any> => {
    const _init = Object.assign({}, {
        headers: {
            Authorization: `Bearer ${service.access_token}`
        }
    }, init);
    const response = await fetch(input, _init);
    const json = await response.json();

    if( json.error ) {
        if( json.error === 'invalid token' ) {
            await refreshAccessToken();
            return await fetchHelper(input, init)
        }
    }
    return json.error || json.data;
}