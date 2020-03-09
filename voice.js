// 引入库:js-base64,js-md5,qs......
const Base64 = require('js-base64').Base64
const md5 = require('js-md5')
const qs = require('qs')
const http = require('http')
const mp3FilePath = require('./const').mp3FilePath
const resUrl = require('./const').resUrl
const fs = require('fs')

function createVoice(req, res) {
  // 接收参数 text文本,lang语种
  const text = req.query.text
  const lang = req.query.lang
  // const text = '测试科大讯飞在线语音合成api的功能，比如说，我们输入一段话，科大讯飞api会在线实时生成语音返回给客户端'
  // const lang = 'cn'
  // 这是科大讯飞定义的变量,不用管,默认引擎类型为中文引擎
  // 科大讯飞是中文引擎,对中文的朗读比较好,英文没那么好
  let engineType = 'intp65'
  if (lang.toLowerCase() === 'en') {
    // 修改为英文引擎
    engineType = 'intp65_en'
  }
  //朗读速度
  const speed = '30'
  // 语音格式
  const voiceParam = {
    // 音频采样率
    auf: 'audio/L16;rate=16000',
    // 音频编码
    aue: 'lame',
    // 发音人
    voice_name: 'xiaoyan',
    speed,
    // 音量
    volume: '50',
    pitch: '50',
    engine_type: engineType,
    text_type: 'text'
  }

  // 获取当前时间,转化为UTC标准的时间戳,通过floor函数将浮点数化整数
  const currentTime = Math.floor(new Date().getTime() / 1000)
  const appId = '5c04d087'
  const apiKey = 'd42c864c47d91f468a70079aab059be5'
  // 通过Base64进行加密
  const xParam = Base64.encode(JSON.stringify(voiceParam))
  const checkSum = md5(apiKey + currentTime + xParam)
  const headers = {}
  headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'
  headers['X-Param'] = xParam
  headers['X-Appid'] = appId
  headers['X-CurTime'] = currentTime
  headers['X-CheckSum'] = checkSum
  headers['X-Real-Ip'] = '127.0.0.1'
  const data = qs.stringify({
    text: text
  })
  // 用于请求参数
  const options = {
    host: 'api.xfyun.cn',
    // 在线语音合成API的地址
    path: '/v1/service/v1/tts',
    method: 'POST',
    headers
  }
  const request = http.request(options, response => {
    console.log('response', response)
    let mp3 = ''
    // 内容的长度
    const contentLength = response.headers['content-length']
    // 将编码格式置为二进制文件
    response.setEncoding('binary')
    response.on('data', data => {
      // 获得MP3文件
      mp3 += data
      // 计算进度百分比
      const process = data.length / contentLength * 100
      const percent = parseInt(process.toFixed(2))
      // console.log(percent)
    })
    response.on('end', () => {
      const contentType = response.headers['content-type']
      if (contentType === 'text/html') {
        //若是html,说明了请求失败,把MP3返回回去,此时这个mp3是一个404 NotFound页面
        res.send(mp3)
      }
      else if (contentType === 'text/plain') {
        //若是plain,说明了请求失败,把MP3返回回去,此时这个mp3是一个404 NotFound页面
        res.send(mp3)
      }
      else {
        //将mp3文件保存到本地,为了让名字不重复, 就将当前的时间戳作为文件名
        const fileName = new Date().getTime()
        //mp3的输出本地路径
        const filePath = `${mp3FilePath}/${fileName}.mp3`
        //mp3的线上下载链接
        const downloadUrl = `${resUrl}/mp3/${fileName}.mp3`
        //filePath:路径,mp3:数据,binary:文件类型
        fs.writeFile(filePath, mp3, 'binary', err => {
          if (err) {
            //产生错误
            res.json({
              error: 1,
              msg: '下载失败'
            })
          }
          else {
            //成功
            res.json({
              error: 0,
              msg: '下载成功',
              path: downloadUrl
            })
          }
        })
      }
    })
  })
  request.write(data)
  request.end()
}

module.exports = createVoice
