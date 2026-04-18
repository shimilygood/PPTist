import axios from './axios'
import fetchRequest from './fetch'
import editorApi from '@/api/editor'

// export const SERVER_URL = 'http://localhost:5000'
export const SERVER_URL = (import.meta.env.MODE === 'development') ? '/api' : 'https://server.pptist.cn'

interface ImageSearchPayload {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'square' | 'all';
  locale?: 'zh' | 'en';
  order?: 'popular' | 'latest';
  size?: 'large' | 'medium' | 'small';
  image_type?: 'all' | 'photo' | 'illustration' | 'vector';
  page?: number;
  per_page?: number;
}

interface AIPPTOutlinePayload {
  content: string
  language: string
  model: string
}

interface AIPPTPayload {
  content: string
  language: string
  style: string
  model: string
}

interface AIWritingPayload {
  content: string
  command: string
}

export default {
  getMockData(filename: string): Promise<any> {
    if (filename === 'imgs') {
      return editorApi.getMaterial().then((res: any) => {
        const groups = Array.isArray(res?.data) ? res.data : []
        const list = groups.flatMap((group: any) => {
          const children = Array.isArray(group?.list) ? group.list : []
          return children.flatMap((child: any) => {
            const items = Array.isArray(child?.data) ? child.data : []
            return items.map((item: any, index: number) => ({
              id: item?.id || `${group?.id || 'g'}-${child?.id || 'c'}-${index}`,
              width: item?.width || 0,
              height: item?.height || 0,
              src: item?.cover || item?.thumbnailUrl || item?.imageUrl || item?.url || '',
            }))
          })
        }).filter((item: any) => !!item.src)

        if (list.length) return list
        return axios.get(`./mocks/${filename}.json`).then((ret: any) => Array.isArray(ret) ? ret : (ret?.imgs || []))
      }).catch(() => {
        return axios.get(`./mocks/${filename}.json`).then((ret: any) => Array.isArray(ret) ? ret : (ret?.imgs || []))
      })
    }

    return axios.get(`./mocks/${filename}.json`)
  },

  searchImage(body: ImageSearchPayload): Promise<any> {
    return axios.post(`${SERVER_URL}/tools/img_search`, body)
  },

  AIPPT_Outline({
    content,
    language,
    model,
  }: AIPPTOutlinePayload): Promise<any> {
    return fetchRequest(`${SERVER_URL}/tools/aippt_outline`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        language,
        model,
        stream: true,
      }),
    })
  },

  AIPPT({
    content,
    language,
    style,
    model,
  }: AIPPTPayload): Promise<any> {
    return fetchRequest(`${SERVER_URL}/tools/aippt`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        language,
        model,
        style,
        stream: true,
      }),
    })
  },

  AI_Writing({
    content,
    command,
  }: AIWritingPayload): Promise<any> {
    return fetchRequest(`${SERVER_URL}/tools/ai_writing`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        command,
        model: 'GLM-4.5-Flash',
        stream: true,
      }),
    })
  },
}