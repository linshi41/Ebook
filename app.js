// 引入库:express,mysql,....
// require(),这个方法可以加载模块
const express = require('express')
const mysql = require('mysql')
const constant = require('./const')
const cors = require('cors')
const voice = require('./voice')
// app代表整个web应用
const app = express()
// 使用插件cors
app.use(cors())
// get请求访问'/'根路径,执行方法:(req, res) => {res.send(new Date().toDateString())})
app.get('/', (req, res) => {
  res.send(new Date().toDateString())
})
// 连接mysql数据库
function connect() {
  return mysql.createConnection({
    // 填写数据库的host,user,password
    host: constant.dbHost,
    user: constant.dbUser,
    password: constant.dbPwd,
    // 连接到book数据库(可以换)
    database: 'book'
  })
}
// 根据数组长度获取随机数
// n: 需要的数,l:一共有多少数
function randomArray(n, l) {
  let rnd = []
  // 循环n次,生成n个数并添加
  for (let i = 0; i < n; i++) {
    // Math.random() * l:生成 0~l的数
    // Math.floor(Math.random() * l) 向下取整
    // rnd.push(Math.floor(Math.random() * l)):添加到结果数组
    rnd.push(Math.floor(Math.random() * l))
  }
  return rnd
}
// 模拟猜你喜欢算法,(假数据)
// data是被选出来的一本书
function createGuessYouLike(data) {
  // 生成随机数,1~3
  const n = parseInt(randomArray(1, 3)) + 1
  // 赋值给这本书
  data['type'] = n
  // 根据不同的值,显示不同的描述内容 (如下)
  switch (n) {
    case 1:
      data['result'] = data.id % 2 === 0 ? '《Executing Magic》' : '《Elements Of Robotics》'
      break
    case 2:
      data['result'] = data.id % 2 === 0 ? '《Improving Psychiatric Care》' : '《Programming Languages》'
      break
    case 3:
      data['result'] = '《Living with Disfigurement》'
      data['percent'] = data.id % 2 === 0 ? '92%' : '97%'
      break
  }
  return data
}

// 模拟推荐算法,(假数据)
function createRecommendData(data) {
  // 生成描述信息: xxxx人同时在阅读
  data['readers'] = Math.floor(data.id / 2 * randomArray(1, 100))
  return data
}
// 根据Key到results中把对应的书籍找出来
function createData(results, key) {
  return handleData(results[key])
}
// data:results[key], 是一本书
function handleData(data) {
  if (!data.cover.startsWith('http://')) {
    // data的封面cvoer不是以'http://'开头的,就需要按如下修改
    data['cover'] = `${constant.resUrl}/img${data.cover}`
  }
  // 初始化一些基本信息(添加的)
  data['selected'] = false
  data['private'] = false
  data['cache'] = false
  data['haveRead'] = 0
  return data
}

function createCategoryIds(n) {
  const arr = []
  constant.category.forEach((item, index) => {
    arr.push(index + 1)
  })
  const result = []
  for (let i = 0; i < n; i++) {
    // 获取的随机数不能重复
    const ran = Math.floor(Math.random() * (arr.length - i))
    // 获取分类对应的序号
    result.push(arr[ran])
    // 将已经获取的随机数取代，用最后一位数
    arr[ran] = arr[arr.length - i - 1]
  }
  return result
}

function createCategoryData(data) {
  const categoryIds = createCategoryIds(6)
  const result = []
  categoryIds.forEach(categoryId => {
    const subList = data.filter(item => item.category === categoryId).slice(0, 4)
    subList.map(item => {
      return handleData(item)
    })
    result.push({
      category: categoryId,
      list: subList
    })
  })
  return result.filter(item => item.list.length === 4)
}

app.get('/book/home', (req, res) => {
  const conn = connect()
  conn.query('select * from book where cover != \'\'',
      (err, results) => {
        // results是查询结果
        const length = results.length
        // home页面的数据guessYouLike,banner,recommend,featured
        const guessYouLike = []
        const banner = constant.resUrl + '/home_banner.jpg'
        const recommend = []
        const featured = []
        // 随即推荐
        const random = []
        const categoryList = createCategoryData(results)
        const categories = [
          {
            category: 1,
            num: 56,
            img1: constant.resUrl + '/cover/cs/A978-3-319-62533-1_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/cs/A978-3-319-89366-2_CoverFigure.jpg'
          },
          {
            category: 2,
            num: 51,
            img1: constant.resUrl + '/cover/ss/A978-3-319-61291-1_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/ss/A978-3-319-69299-9_CoverFigure.jpg'
          },
          {
            category: 3,
            num: 32,
            img1: constant.resUrl + '/cover/eco/A978-3-319-69772-7_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/eco/A978-3-319-76222-7_CoverFigure.jpg'
          },
          {
            category: 4,
            num: 60,
            img1: constant.resUrl + '/cover/edu/A978-981-13-0194-0_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/edu/978-3-319-72170-5_CoverFigure.jpg'
          },
          {
            category: 5,
            num: 23,
            img1: constant.resUrl + '/cover/eng/A978-3-319-39889-1_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/eng/A978-3-319-00026-8_CoverFigure.jpg'
          },
          {
            category: 6,
            num: 42,
            img1: constant.resUrl + '/cover/env/A978-3-319-12039-3_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/env/A978-4-431-54340-4_CoverFigure.jpg'
          },
          {
            category: 7,
            num: 7,
            img1: constant.resUrl + '/cover/geo/A978-3-319-56091-5_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/geo/978-3-319-75593-9_CoverFigure.jpg'
          },
          {
            category: 8,
            num: 18,
            img1: constant.resUrl + '/cover/his/978-3-319-65244-3_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/his/978-3-319-92964-4_CoverFigure.jpg'
          },
          {
            category: 9,
            num: 13,
            img1: constant.resUrl + '/cover/law/2015_Book_ProtectingTheRightsOfPeopleWit.jpeg',
            img2: constant.resUrl + '/cover/law/2016_Book_ReconsideringConstitutionalFor.jpeg'
          },
          {
            category: 10,
            num: 24,
            img1: constant.resUrl + '/cover/ls/A978-3-319-27288-7_CoverFigure.jpg',
            img2: constant.resUrl + '/cover/ls/A978-1-4939-3743-1_CoverFigure.jpg'
          },
          {
            category: 11,
            num: 6,
            img1: constant.resUrl + '/cover/lit/2015_humanities.jpg',
            img2: constant.resUrl + '/cover/lit/A978-3-319-44388-1_CoverFigure_HTML.jpg'
          },
          {
            category: 12,
            num: 14,
            img1: constant.resUrl + '/cover/bio/2016_Book_ATimeForMetabolismAndHormones.jpeg',
            img2: constant.resUrl + '/cover/bio/2017_Book_SnowSportsTraumaAndSafety.jpeg'
          },
          {
            category: 13,
            num: 16,
            img1: constant.resUrl + '/cover/bm/2017_Book_FashionFigures.jpeg',
            img2: constant.resUrl + '/cover/bm/2018_Book_HeterogeneityHighPerformanceCo.jpeg'
          },
          {
            category: 14,
            num: 16,
            img1: constant.resUrl + '/cover/es/2017_Book_AdvancingCultureOfLivingWithLa.jpeg',
            img2: constant.resUrl + '/cover/es/2017_Book_ChinaSGasDevelopmentStrategies.jpeg'
          },
          {
            category: 15,
            num: 2,
            img1: constant.resUrl + '/cover/ms/2018_Book_ProceedingsOfTheScientific-Pra.jpeg',
            img2: constant.resUrl + '/cover/ms/2018_Book_ProceedingsOfTheScientific-Pra.jpeg'
          },
          {
            category: 16,
            num: 9,
            img1: constant.resUrl + '/cover/mat/2016_Book_AdvancesInDiscreteDifferential.jpeg',
            img2: constant.resUrl + '/cover/mat/2016_Book_ComputingCharacterizationsOfDr.jpeg'
          },
          {
            category: 17,
            num: 20,
            img1: constant.resUrl + '/cover/map/2013_Book_TheSouthTexasHealthStatusRevie.jpeg',
            img2: constant.resUrl + '/cover/map/2016_Book_SecondaryAnalysisOfElectronicH.jpeg'
          },
          {
            category: 18,
            num: 16,
            img1: constant.resUrl + '/cover/phi/2015_Book_TheOnlifeManifesto.jpeg',
            img2: constant.resUrl + '/cover/phi/2017_Book_Anti-VivisectionAndTheProfessi.jpeg'
          },
          {
            category: 19,
            num: 10,
            img1: constant.resUrl + '/cover/phy/2016_Book_OpticsInOurTime.jpeg',
            img2: constant.resUrl + '/cover/phy/2017_Book_InterferometryAndSynthesisInRa.jpeg'
          },
          {
            category: 20,
            num: 26,
            img1: constant.resUrl + '/cover/psa/2016_Book_EnvironmentalGovernanceInLatin.jpeg',
            img2: constant.resUrl + '/cover/psa/2017_Book_RisingPowersAndPeacebuilding.jpeg'
          },
          {
            category: 21,
            num: 3,
            img1: constant.resUrl + '/cover/psy/2015_Book_PromotingSocialDialogueInEurop.jpeg',
            img2: constant.resUrl + '/cover/psy/2015_Book_RethinkingInterdisciplinarityA.jpeg'
          },
          {
            category: 22,
            num: 1,
            img1: constant.resUrl + '/cover/sta/2013_Book_ShipAndOffshoreStructureDesign.jpeg',
            img2: constant.resUrl + '/cover/sta/2013_Book_ShipAndOffshoreStructureDesign.jpeg'
          }
        ]
        randomArray(9, length).forEach(key => {
          // 从总书目中取出9本书(Key)
          // createData(results, key): 根据key获取书籍
          // 猜你喜欢
          guessYouLike.push(createGuessYouLike(createData(results, key)))
        })
        randomArray(3, length).forEach(key => {
          // 热门推荐
          recommend.push(createRecommendData(createData(results, key)))
        })
        randomArray(6, length).forEach(key => {
          // 精选
          featured.push(createData(results, key))
        })
        randomArray(1, length).forEach(key => {
          // 随机推荐
          random.push(createData(results, key))
        })
        // 返回到前台的JSON
        res.json({
          guessYouLike,
          banner,
          recommend,
          featured,
          categoryList,
          categories,
          random
        })
        conn.end()
      })
})
//
// app.get('/book/home', (req, res) => {
//   const conn = connect()
//   conn.query('select * from book where cover != \'\'',
//     (err, results) => {
//       const length = results.length
//       const guessYouLike = []
//       const banner = constant.resUrl + '/home_banner.jpg'
//       const recommend = []
//       const featured = []
//       const random = []
//       const categoryList = createCategoryData(results)
//       const categories = [
//         {
//           category: 1,
//           num: 56,
//           img1: constant.resUrl + '/cover/cs/A978-3-319-62533-1_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/cs/A978-3-319-89366-2_CoverFigure.jpg'
//         },
//         {
//           category: 2,
//           num: 51,
//           img1: constant.resUrl + '/cover/ss/A978-3-319-61291-1_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/ss/A978-3-319-69299-9_CoverFigure.jpg'
//         },
//         {
//           category: 3,
//           num: 32,
//           img1: constant.resUrl + '/cover/eco/A978-3-319-69772-7_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/eco/A978-3-319-76222-7_CoverFigure.jpg'
//         },
//         {
//           category: 4,
//           num: 60,
//           img1: constant.resUrl + '/cover/edu/A978-981-13-0194-0_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/edu/978-3-319-72170-5_CoverFigure.jpg'
//         },
//         {
//           category: 5,
//           num: 23,
//           img1: constant.resUrl + '/cover/eng/A978-3-319-39889-1_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/eng/A978-3-319-00026-8_CoverFigure.jpg'
//         },
//         {
//           category: 6,
//           num: 42,
//           img1: constant.resUrl + '/cover/env/A978-3-319-12039-3_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/env/A978-4-431-54340-4_CoverFigure.jpg'
//         },
//         {
//           category: 7,
//           num: 7,
//           img1: constant.resUrl + '/cover/geo/A978-3-319-56091-5_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/geo/978-3-319-75593-9_CoverFigure.jpg'
//         },
//         {
//           category: 8,
//           num: 18,
//           img1: constant.resUrl + '/cover/his/978-3-319-65244-3_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/his/978-3-319-92964-4_CoverFigure.jpg'
//         },
//         {
//           category: 9,
//           num: 13,
//           img1: constant.resUrl + '/cover/law/2015_Book_ProtectingTheRightsOfPeopleWit.jpeg',
//           img2: constant.resUrl + '/cover/law/2016_Book_ReconsideringConstitutionalFor.jpeg'
//         },
//         {
//           category: 10,
//           num: 24,
//           img1: constant.resUrl + '/cover/ls/A978-3-319-27288-7_CoverFigure.jpg',
//           img2: constant.resUrl + '/cover/ls/A978-1-4939-3743-1_CoverFigure.jpg'
//         },
//         {
//           category: 11,
//           num: 6,
//           img1: constant.resUrl + '/cover/lit/2015_humanities.jpg',
//           img2: constant.resUrl + '/cover/lit/A978-3-319-44388-1_CoverFigure_HTML.jpg'
//         },
//         {
//           category: 12,
//           num: 14,
//           img1: constant.resUrl + '/cover/bio/2016_Book_ATimeForMetabolismAndHormones.jpeg',
//           img2: constant.resUrl + '/cover/bio/2017_Book_SnowSportsTraumaAndSafety.jpeg'
//         },
//         {
//           category: 13,
//           num: 16,
//           img1: constant.resUrl + '/cover/bm/2017_Book_FashionFigures.jpeg',
//           img2: constant.resUrl + '/cover/bm/2018_Book_HeterogeneityHighPerformanceCo.jpeg'
//         },
//         {
//           category: 14,
//           num: 16,
//           img1: constant.resUrl + '/cover/es/2017_Book_AdvancingCultureOfLivingWithLa.jpeg',
//           img2: constant.resUrl + '/cover/es/2017_Book_ChinaSGasDevelopmentStrategies.jpeg'
//         },
//         {
//           category: 15,
//           num: 2,
//           img1: constant.resUrl + '/cover/ms/2018_Book_ProceedingsOfTheScientific-Pra.jpeg',
//           img2: constant.resUrl + '/cover/ms/2018_Book_ProceedingsOfTheScientific-Pra.jpeg'
//         },
//         {
//           category: 16,
//           num: 9,
//           img1: constant.resUrl + '/cover/mat/2016_Book_AdvancesInDiscreteDifferential.jpeg',
//           img2: constant.resUrl + '/cover/mat/2016_Book_ComputingCharacterizationsOfDr.jpeg'
//         },
//         {
//           category: 17,
//           num: 20,
//           img1: constant.resUrl + '/cover/map/2013_Book_TheSouthTexasHealthStatusRevie.jpeg',
//           img2: constant.resUrl + '/cover/map/2016_Book_SecondaryAnalysisOfElectronicH.jpeg'
//         },
//         {
//           category: 18,
//           num: 16,
//           img1: constant.resUrl + '/cover/phi/2015_Book_TheOnlifeManifesto.jpeg',
//           img2: constant.resUrl + '/cover/phi/2017_Book_Anti-VivisectionAndTheProfessi.jpeg'
//         },
//         {
//           category: 19,
//           num: 10,
//           img1: constant.resUrl + '/cover/phy/2016_Book_OpticsInOurTime.jpeg',
//           img2: constant.resUrl + '/cover/phy/2017_Book_InterferometryAndSynthesisInRa.jpeg'
//         },
//         {
//           category: 20,
//           num: 26,
//           img1: constant.resUrl + '/cover/psa/2016_Book_EnvironmentalGovernanceInLatin.jpeg',
//           img2: constant.resUrl + '/cover/psa/2017_Book_RisingPowersAndPeacebuilding.jpeg'
//         },
//         {
//           category: 21,
//           num: 3,
//           img1: constant.resUrl + '/cover/psy/2015_Book_PromotingSocialDialogueInEurop.jpeg',
//           img2: constant.resUrl + '/cover/psy/2015_Book_RethinkingInterdisciplinarityA.jpeg'
//         },
//         {
//           category: 22,
//           num: 1,
//           img1: constant.resUrl + '/cover/sta/2013_Book_ShipAndOffshoreStructureDesign.jpeg',
//           img2: constant.resUrl + '/cover/sta/2013_Book_ShipAndOffshoreStructureDesign.jpeg'
//         }
//       ]
//       randomArray(9, length).forEach(key => {
//         guessYouLike.push(createGuessYouLike(createData(results, key)))
//       })
//       randomArray(3, length).forEach(key => {
//         recommend.push(createRecommendData(createData(results, key)))
//       })
//       randomArray(6, length).forEach(key => {
//         featured.push(createData(results, key))
//       })
//       randomArray(1, length).forEach(key => {
//         random.push(createData(results, key))
//       })
//       res.json({
//         guessYouLike,
//         banner,
//         recommend,
//         featured,
//         categoryList,
//         categories,
//         random
//       })
//       conn.end()
//     })
// })

// 书籍详情
app.get('/book/detail', (req, res) => {
  //连接mysql数据库
  const conn = connect()
  //获取进入详情页面的书籍名
  const fileName = req.query.fileName
  // 从数据库中搜索到这本书
  const sql = `select * from book where fileName='${fileName}'`
  //数据库执行sql语句,返回结果放到results
  conn.query(sql, (err, results) => {
    if (err) {
      // 查询失败
      res.json({
        error_code: 1,
        msg: '电子书详情获取失败'
      })
    } else {
      if (results && results.length === 0) {
        res.json({
          error_code: 1,
          msg: '电子书详情获取失败'
        })
      } else {
        // 返回的结果results是一个数组,但这只有一个元素
        const book = handleData(results[0])
        res.json({
          error_code: 0,
          msg: '获取成功',
          data: book
        })
      }
    }
    conn.end()
  })
})

// 书籍的分类列表
app.get('/book/list', (req, res) => {
  // 连接到mysql数据库
  const conn = connect()
  // 执行sql语句
  conn.query('select * from book where cover!=\'\'',
    (err, results) => {
      if (err) {
        console.log(err)
        // 执行失败,发送json格式的数据到前台
        res.json({
          // error_code = 0 :表示成功, =1 : 表示失败
          error_code: 1,
          msg: '获取失败'
        })
      } else {
        // 执行成功,遍历results结果,给每一本书进行初始化
        results.map(item => handleData(item))
        const data = {}
        // 遍历所有书籍类别
        constant.category.forEach(categoryText => {
          // 保留属于categoryText该分类的书籍,存入data[categoryText]
          // 即对所有书籍进行分类
          data[categoryText] = results.filter(item => item.categoryText === categoryText)
        })
        res.json({
          error_code: 0,
          msg: '获取成功',
          data: data,
          total: results.length
        })
      }
      // 不管执行是否成功,都要把数据库进行关闭,不关闭就会一直占用内存
      conn.end()
    })
})

// 搜索结果列表
app.get('/book/flat-list', (req, res) => {
  // 连接数据库
  const conn = connect()
  // 查询出所有的书籍
  conn.query('select * from book where cover!=\'\'',
    (err, results) => {
      if (err) {
        res.json({
          error_code: 1,
          msg: '获取失败'
        })
      } else {
        // 遍历所有书籍, 给每一本书进行初始化
        results.map(item => handleData(item))
        res.json({
          error_code: 0,
          msg: '获取成功',
          data: results,
          total: results.length
        })
      }
      conn.end()
    })
})

// 书架列表
app.get('/book/shelf', (req, res) => {
  console.log('/book/shelf', req, res)
  res.json({
    bookList: []
  })
})

app.get('/voice', (req, res) => {
  voice(req, res)
})

const server = app.listen(3000, () => {
  // host:当前监听的IP地址
  const host = server.address().address
  // port:监听的端口号,就是3000
  const port = server.address().port
  console.log('server is listening at http://%s:%s', host, port)
})
