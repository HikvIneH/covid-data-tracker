import dotenv from 'dotenv';
import twilio from 'twilio';
import Redis from 'ioredis';
import JSONCache from 'redis-json';

dotenv.config();

const {
  TWILLIO_SID: accountSid,
  TWILLIO_KEY: TwilloAuthToken,
} = process.env;

twilio(accountSid, TwilloAuthToken);
const { MessagingResponse } = twilio.twiml;

let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new Redis(REDIS_URL);
const jsonCache = new JSONCache(redis, {prefix: 'cache:'})

/**
 * @class WhatsappBot
 * @description class will implement bot functionality
 */
let resss;
class WhatsappBot {
  /**
   * @memberof WhatsappBot
   * @param {object} req - Request sent to the route
   * @param {object} res - Response sent from the controller
   * @param {object} next - Error handler
   * @returns {object} - object representing response message
   */

  static async covidData(req, res, next) {
    const twiml = new MessagingResponse();
    let q = req.body.Body;
    let result;
    let option;
    let countryCode = "none";
    let text = "Command Not Found";

    try {
      if(q.startsWith("CASES TOTAL")) {
        option = "totalCases"
      } else if(q.startsWith("DEATHS TOTAL")) {
        option = "totalDeaths"
      } else if(q.startsWith("CASES")) {
        option = "cases";
        var string = q.split(' ');
        countryCode = string[1];
      } else if(q.startsWith("DEATHS")) {
        option = "deaths";
        var string = q.split(' ');
        countryCode = string[1];
      }  else {
        twiml.message(text);
        res.set('Content-Type', 'text/xml');
        return res.status(200).send(twiml.toString());
      }

      switch(option) {
        case "cases":
        case "deaths":
          const responseCountry = await jsonCache.get('countries');
          result = searchByCountry(option, countryCode, responseCountry)
          break;
        case "totalCases":
        case "totalDeaths":
          const responseGlobal = await jsonCache.get('global');
          result = getGlobalData(option, responseGlobal)
          break;
        default:
          result = "I have never heard of that fruit...";
      }


      function searchByCountry(option, countryCode, responseCountry) {
        let country;
        for (let i = 0; i < responseCountry.length; i++) {
          country = responseCountry[i];
          if(country.countryInfo.iso2 === countryCode || country.countryInfo.iso3 === countryCode) {
            break;           
          } else {
            continue;
          }
        }
        if(option === 'cases') {
          return "Total cases in " + country.country + " is: " + country.cases + " cases";
        } else if (option === 'deaths') {
          return "Total death cases in " + country.country + " is: " + country.deaths + " cases";
        }
      }

      function getGlobalData(option, responseGlobal) {
        if(option === 'totalCases') {
          return "Total cases global cases is: " + responseGlobal.cases + " cases";
        } else if (option === 'totalDeaths') {
          return "Total cases global death cases is: " + responseGlobal.deaths + " cases";
        }
      }

      twiml.message(`${result}`);

      res.set('Content-Type', 'text/xml');

      return res.status(200).send(twiml.toString());
    } catch (error) {
      return next(error);
    }
  }
}

export default WhatsappBot;