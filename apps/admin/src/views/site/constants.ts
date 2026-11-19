/** 官网品牌信息（与后台标题解耦，避免改后台标题影响前台） */
export const SITE_NAME = '改枪坊'

export const SITE_SUBTITLE = '可云旗下平台(www.hafubi.net)'

/** 客户端下载地址，可用 VITE_DOWNLOAD_URL 覆盖 */
export const DOWNLOAD_URL = import.meta.env.VITE_DOWNLOAD_URL || 'https://github.com/miyaohua/firend-plays/releases'

/** 新窗口打开客户端下载页 */
export function openDownloadPage() {
  window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer')
}
