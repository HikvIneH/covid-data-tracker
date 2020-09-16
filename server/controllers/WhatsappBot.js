import dotenv from 'dotenv';
import twilio from 'twilio';
import fetch from 'node-fetch';
dotenv.config();

const {
  TWILLIO_SID: accountSid,
  TWILLIO_KEY: TwilloAuthToken,
} = process.env;

twilio(accountSid, TwilloAuthToken);
const { MessagingResponse } = twilio.twiml;

/**
 * @class WhatsappBot
 * @description class will implement bot functionality
 */
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

    try {
      let response = await fetch(`https://corona.lmao.ninja/v2/countries/${q}?strict&query`);
      const data = await response.json();
      const result = JSON.stringify(data);
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