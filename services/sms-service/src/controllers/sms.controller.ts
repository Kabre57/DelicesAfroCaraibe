import { Request, Response } from 'express'
import { SMSService } from '../services/sms.service'

const smsService = new SMSService()

export class SMSController {
  async sendSMS(req: Request, res: Response) {
    try {
      const { to, message } = req.body

      if (!to || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' })
      }

      const result = await smsService.sendSMS(to, message)

      res.json(result)
    } catch (error: any) {
      console.error('Send SMS error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async sendTemplate(req: Request, res: Response) {
    try {
      const { to, template, data } = req.body

      if (!to || !template) {
        return res.status(400).json({ error: 'Phone number and template are required' })
      }

      const result = await smsService.sendTemplate(to, template, data)

      res.json(result)
    } catch (error: any) {
      console.error('Send template SMS error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async verifyPhone(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' })
      }

      const result = await smsService.verifyPhone(phoneNumber)

      res.json(result)
    } catch (error: any) {
      console.error('Verify phone error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async verifyCode(req: Request, res: Response) {
    try {
      const { phoneNumber, code } = req.body

      if (!phoneNumber || !code) {
        return res.status(400).json({ error: 'Phone number and code are required' })
      }

      const result = await smsService.verifyCode(phoneNumber, code)

      res.json(result)
    } catch (error: any) {
      console.error('Verify code error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async bulkSend(req: Request, res: Response) {
    try {
      const { recipients, message } = req.body

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Valid recipients array is required' })
      }

      const results = await smsService.bulkSend(recipients, message)

      res.json(results)
    } catch (error: any) {
      console.error('Bulk send error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async getSMSStatus(req: Request, res: Response) {
    try {
      const { messageId } = req.params

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' })
      }

      const result = await smsService.getSMSStatus(messageId)

      res.json(result)
    } catch (error: any) {
      console.error('Get SMS status error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
