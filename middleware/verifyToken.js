import admin from '../firebaseService.js';

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // 🚨 Temporary dev token for local testing
  if (token === 'test-barber-token') {
    req.firebaseUser = {
      uid: 'test_firebase_uid_12345',
      phone_number: '+911234567890'
    };
    return next();
  }

  // 🚨 Temporary dev token for user testing
  if (token === 'test-user-token') {
    req.firebaseUser = {
      uid: 'test_user_uid_12345',
      phone_number: '+911234567891'
    };
    return next();
  }

  // 🚨 Temporary dev token for user 2 testing
  if (token === 'test-user-token-2') {
    req.firebaseUser = {
      uid: 'test_user_uid_67890',
      phone_number: '+911234567892'
    };
    return next();
  }

  // 🚨 Temporary dev token for user 3 testing
  if (token === 'test-user-token-3') {
    req.firebaseUser = {
      uid: 'test_user_uid_11111',
      phone_number: '+911234567893'
    };
    return next();
  }

  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default verifyToken;