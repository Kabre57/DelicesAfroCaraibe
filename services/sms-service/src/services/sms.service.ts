import twilio from 'twilio'

interface SMSTemplate {
  orderConfirmed: (orderNumber: string) => string
  orderReady: (orderNumber: string, restaurantName: string) => string
  orderPickedUp: (orderNumber: string, driverName: string) => string
  orderDelivered: (orderNumber: string) => string
  orderCancelled: (orderNumber: string) => string
  verificationCode: (code: string) => string
  promotionalOffer: (offer: string) => string
}

const templates: SMSTemplate = {
  orderConfirmed: (orderNumber) =>
    `Votre commande #${orderNumber} a été confirmée. Nous préparons vos délices ! 🍛`,

  orderReady: (orderNumber, restaurantName) =>
    `Votre commande #${orderNumber} est prête chez ${restaurantName}. Un livreur va bientôt la récupérer ! 📦`,

  orderPickedUp: (orderNumber, driverName) =>
    `${driverName} a récupéré votre commande #${orderNumber} et est en route ! 🚗`,

  orderDelivered: (orderNumber) =>
    `Votre commande #${orderNumber} a été livrée. Bon appétit ! 🎉`,

  orderCancelled: (orderNumber) =>
    `Votre commande #${orderNumber} a été annulée. Nous vous remboursons sous 3-5 jours ouvrés.`,

  verificationCode: (code) =>
    `Votre code de vérification Délices Afro-Caraïbe : ${code}. Ne le partagez avec personne.`,

  promotionalOffer: (offer) =>
    `🎁 Offre spéciale ! ${offer}. Commandez maintenant sur Délices Afro-Caraïbe !`,
}

export class SMSService {
  private client: twilio.Twilio

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }

  async sendSMS(to: string, message: string) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      })

      return {
        messageId: result.sid,
        status: result.status,
        to: result.to,
      }
    } catch (error) {
      console.error('Send SMS error:', error)
      throw error
    }
  }

  async sendTemplate(to: string, template: string, data: any[] = []) {
    try {
      if (!(template in templates)) {
        throw new Error('Invalid template name')
      }

      // Cast la fonction pour accepter un spread générique sans erreur TS
      const tpl = templates[template as keyof SMSTemplate] as (...args: any[]) => string
      const message = tpl(...data)

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      })

      return {
        messageId: result.sid,
        status: result.status,
        to: result.to,
        message,
      }
    } catch (error) {
      console.error('Send template SMS error:', error)
      throw error
    }
  }

  async verifyPhone(phoneNumber: string) {
    try {
      const verification = await this.client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID || '')
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        })

      return {
        status: verification.status,
        to: verification.to,
      }
    } catch (error) {
      console.error('Verify phone error:', error)
      throw error
    }
  }

  async verifyCode(phoneNumber: string, code: string) {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID || '')
        .verificationChecks.create({
          to: phoneNumber,
          code,
        })

      return {
        status: verificationCheck.status,
        valid: verificationCheck.status === 'approved',
      }
    } catch (error) {
      console.error('Verify code error:', error)
      throw error
    }
  }

  async bulkSend(recipients: string[], message: string) {
    try {
      const sendPromises = recipients.map((to) =>
        this.client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to,
        })
      )

      const results = await Promise.allSettled(sendPromises)

      const successful = results.filter((r) => r.status === 'fulfilled')
      const failed = results.filter((r) => r.status === 'rejected')

      return {
        total: recipients.length,
        successful: successful.length,
        failed: failed.length,
        results: results.map((r, i) => ({
          to: recipients[i],
          status: r.status,
          messageId: r.status === 'fulfilled' ? r.value.sid : undefined,
          error: r.status === 'rejected' ? r.reason.message : undefined,
        })),
      }
    } catch (error) {
      console.error('Bulk send error:', error)
      throw error
    }
  }

  async getSMSStatus(messageId: string) {
    try {
      const message = await this.client.messages(messageId).fetch()

      return {
        messageId: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      }
    } catch (error) {
      console.error('Get SMS status error:', error)
      throw error
    }
  }
}
