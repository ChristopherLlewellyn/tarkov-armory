'use strict'

const User = use('App/Models/User')
const Mail = use('Mail')
const PasswordReset = use('App/Models/PasswordReset')
const randomString = require('random-string')
const UsernameGenerator = require('username-generator')

class UserController {

  // log the user in using email and password from post request
  async login({ request, auth, response }) {
    const { email, password } = request.all()

    // check user has confirmed their email
    const user = await User.query()
      .where('email', email)
      .where('is_active', true)
      .first()
    
      if(user) {
        // verify password
        const token = await auth.attempt(email, password)
        return token
      }
      else {
        response.status(404).json({
          message: `We couldn't verify your credentials. If you've signed up, make sure you've confirmed your email address!`
        })
      }
  }

  // get the email and password from post request and create a new User
  async register({ request, response }) {
    const { email, password, username } = request.all()
    const user = await User.create({ 
      email, 
      password, 
      username,
      confirmation_token: randomString({ length: 40 })
    })

    // send confirmation email to user
    await Mail.send('emails.confirm_email', user.toJSON(), message => {
      message.to(user.email)
      .from('quartermaster@tarkovarmory.com')
      .subject('Please confirm your email address')
    })

    response.status(201).json({
      message: 'Registration successful! An email has been sent to your email address. Please follow the instructions to verify your account.'
    })
  }

  // confirm a user's email address using confirmation token
  async confirmEmail({ params, response }) {
    const user = await User.findBy('confirmation_token', params.token)

    // remove their confirmation token and set the user as active
    user.confirmation_token = null
    user.is_active = true
    await user.save()

    response.status(200).json({
      message: 'Your email address has been confirmed!'
    })
  }

  // send a password reset email to a user's email address
  async sendPasswordResetEmail({ request, response }) {
    const { email } = request.all()

    try {
      const user = await User.findBy('email', email)
      
      // delete password reset token if already exists
      await PasswordReset.query().where('email', user.email).delete()


      const { token } = await PasswordReset.create({
        email: user.email,
        token: randomString({ length: 40 })
      })

      const username = user.toJSON().username
      const mailData = {
        username,
        token
      }

      await Mail.send('emails.password_reset', mailData, message => {
        message.to(user.email)
        .from('quartermaster@tarkovarmory.com')
        .subject('Password reset link')
      })

      response.status(200).json({
        message: 'A password reset link has been sent to your email address.'
      })
    }


    catch (error) {
      response.status(404).json({
        message: 'Sorry, we could not find a user associated with that email address.'
      })
    }
  }

  async resetPassword({ request, response }) {
    try {
      const user = await User.findBy('email', request.input('email'))

      const token = await PasswordReset.query()
        .where('email', user.email)
        .where('token', request.input('token'))
        .first()

      if(!token) {
        return response.status(404).json({
          message: 'This password reset token does not exist.'
        })
      }
      
      user.password = request.input('password') // will be hashed automatically on save
      await user.save()

      // delete password reset token
      await PasswordReset.query().where('email', user.email).delete()

      response.status(200).json({
        message: 'Your password has been reset.'
      })
    }

    catch(error) {
      response.status(404).json({
        message: 'Sorry, we could not find a user associated with that email address.'
      })
    }
  }

  // return all users
  async index({ response }) {
    const users = await User.all()

    response.status(200).json({
      message: 'Here is every user',
      data: users
    })
  }

  // return one user
  async show({ request, response, params: { id } }) {
    const user = request.user

    response.status(200).json({
      message: 'Here is your user',
      data: user
    })
  }

  // --- SOCIAL SIGN UP/LOG IN ---
  // 'provider' is the 3rd party authenticator's name, e.g. 'google' or 'facebook'
  async redirect ({ ally, params: { provider }}) {
    const redirectUrl = await ally.driver(provider).getRedirectUrl()
    return redirectUrl
  }

  // 'provider' is the 3rd party authenticator's name, e.g. 'google' or 'facebook'
  async callback ({ ally, auth, params: { provider } }) {
    try {
      const providerUser = await ally.driver(provider).getUser()

      // user details to be saved
      // the username is randomly generated
      const userDetails = {
        email: providerUser.getEmail(),
        username: UsernameGenerator.generateUsername(),
        is_active: 1,
      }
      
      // check if username is taken
      // if it is, generate a new username with a random number on the end and check again
      let checking = true;
      while (checking) {
        let alreadyExists = await User.findBy('username', userDetails.username)
        if (!alreadyExists) {
          checking = false;
        }
        else {
          console.log(alreadyExists.username + " already exists")
          let newUsername = UsernameGenerator.generateUsername()
          let randomNumber = Math.floor(Math.random() * 999) + 1
          userDetails.username = newUsername + randomNumber.toString()
        }
      }

      // search for existing user
      const whereClause = {
        email: providerUser.getEmail()
      }

      const user = await User.findOrCreate(whereClause, userDetails)
      const token = await auth.generate(user) // generates JWT token for user

      return token
    } catch (error) {
      return 'Unable to authenticate. Try again later'
    }
  }

}

module.exports = UserController
