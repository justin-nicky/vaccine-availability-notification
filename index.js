const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()
var nodemailer = require('nodemailer')

var data = []
var minutes = 1,
  the_interval = minutes * 60 * 1000

let sendNotification = (rev, ageLimit) => {
  //COVISHIELD vaccine Available for age group
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    auth: {
      //type: 'OAuth2',
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  })
  var maillist = [process.env.E1, process.env.E2]
  var mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: maillist,
    subject: 'Covid Vaccine Available',
    text: `COVISHIELD vaccine Available for age group: ${ageLimit} Date ${rev}`,
  }
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      process.exit()
    }
  })
}
let callAPI = async (rev) => {
  await axios
    .get(`${process.env.API}${rev}`)
    .then((response) => {
      if (response.data.sessions.length) {
        var [{ capacity, ageLimit, vaccine }] = response.data.sessions.map(
          function (item) {
            return {
              capacity: item.available_capacity_dose1,
              ageLimit: item.min_age_limit,
              vaccine: item.vaccine,
            }
          }
        )
        if ((capacity > 0) & (vaccine == 'COVISHIELD')) {
          data.push({ rev, capacity, ageLimit })
        }
      } else {
        console.log('No data')
      }
    })
    .catch((error) => {
      console.log(error)
    })
}

setInterval(async () => {
  for (let i = 0; i <= 7; i++) {
    var today = new Date()
    var nextDay = new Date(today)
    nextDay.setDate(nextDay.getDate() + i)
    var d = nextDay.toJSON().split('T')[0]
    var rev = d.split('-').reverse().join('-')
    await callAPI(rev)
  }
  if (data.length) {
    sendNotification(data[0].rev, data[0].ageLimit)
  }
}, minutes)
