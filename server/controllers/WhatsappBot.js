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
    const commandList = "Command List: \n" + 
    "- *CASES <country code>* \n (Retrieves total cases for specific country)\n" +
    "- *DEATHS <country code>* \n (Retrieves total death cases for specific country)\n" +
    "- *CASES TOTAL* \n (Retrieves total cases globally)\n" +
    "- *DEATHS TOTAL* \n (Retrieves total death cases globally)\n";
    let text = commandList;

    try {
      const string = q.split(' ');
      if(string.length > 2) {
        twiml.message(text);
        res.set('Content-Type', 'text/xml');
        return res.status(200).send(twiml.toString());
      }

      if(q.startsWith("CASES TOTAL")) {
        option = "totalCases"
      } else if(q.startsWith("DEATHS TOTAL")) {
        option = "totalDeaths"
      } else if(q.startsWith("CASES")) {
        option = "cases";
        countryCode = string[1];
      } else if(q.startsWith("DEATHS")) {
        option = "deaths";
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
          result = "Not Found";
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
        const lastUpdated = getDate(country.updated);
        console.log(lastUpdated)
        if(option === 'cases') {
          return "Total cases in " + country.country + " is: " + numberWithCommas(country.cases) + " cases.\n\n" +
              "Last updated at: " + lastUpdated;
        } else if (option === 'deaths') {
          return "Total death cases in " + country.country + " is: " + numberWithCommas(country.deaths) + " cases.\n\n" +
          "Last updated at: " + lastUpdated;
        }
      }

      function getGlobalData(option, responseGlobal) {
        const lastUpdated = getDate(responseGlobal.updated);

        if(option === 'totalCases') {
          return "Total cases global cases is: " + numberWithCommas(responseGlobal.cases) + " cases.\n\n" +
          "Last updated at: " + lastUpdated;
        } else if (option === 'totalDeaths') {
          return "Total cases global death cases is: " + numberWithCommas(responseGlobal.deaths) + " cases.\n\n" +
          "Last updated at: " + lastUpdated;
        }
      }

      function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }

      function getDate(unixTimestamp) {
        const date = new Date(unixTimestamp);
        return date.toLocaleString()

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