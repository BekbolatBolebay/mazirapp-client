import { sendCustomOtp, verifyCustomOtp } from '../lib/auth/auth-actions'
import { query } from '../lib/db'

async function testOtp() {
  const testEmail = 'bolebay.bekbolat.25@gmail.com'
  const testName = 'Test User'
  const testPhone = '+77070000000'

  console.log('1. Testing sendCustomOtp...')
  try {
    const sendResult = await sendCustomOtp(testEmail, testName, testPhone)
    console.log('Send Result:', sendResult)

    console.log('2. checking DB for OTP code...')
    const dbRes = await query(
      'SELECT code FROM otp_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [testEmail]
    )
    
    if (dbRes.rowCount === 0) {
      console.error('OTP code not found in DB!')
      return
    }
    
    const code = dbRes.rows[0].code
    console.log('Found Code in DB:', code)

    console.log('3. Testing verifyCustomOtp...')
    const verifyResult = await verifyCustomOtp(testEmail, code)
    console.log('Verify Result:', verifyResult)

    if (verifyResult.success) {
      console.log('SUCCESS: OTP flow verified!')
    } else {
      console.error('FAILURE: OTP verification failed!')
    }

  } catch (error) {
    console.error('TEST FAILED:', error)
  }
}

testOtp()
