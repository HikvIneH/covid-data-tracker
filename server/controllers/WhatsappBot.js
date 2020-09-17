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

    try {
      const response = await jsonCache.get('data');

      console.log(response[0].countryInfo.iso2);
      
      // TODO use a better solution for this with map
      console.log(response[0]);
      for (let i = 0; i < response.length; i++) {
          let country = response[i];
          if(country.countryInfo.iso2 === q) {
            result = JSON.stringify(country);
            break;           
          } else {
            continue;
          }
      }
      console.log(result);

      twiml.message(`${result}`);

      res.set('Content-Type', 'text/xml');

      return res.status(200).send(twiml.toString());
    } catch (error) {
      return next(error);
    }
  }
}

export default WhatsappBot;