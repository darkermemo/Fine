const { supabaseAdmin } = require('../config/supabase');
const crypto = require('crypto');

// Generate a transaction ID
const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'user' } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.error('errors.validationError', 400, 'Please provide all required fields: email, password, firstName, lastName, phone');
    }

    // Create user in Supabase Auth with email pre-confirmed (for development)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        firstName,
        lastName,
        phone
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      if (authError.message.includes('already registered')) {
        return res.error('auth.userExists', 400);
      }
      return res.error('errors.serverError', 400, authError.message);
    }

    // Get role ID
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !roleData) {
      console.error('Role fetch error:', roleError);
      // Delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.error('errors.invalidInput', 400, 'Invalid role specified');
    }

    // Create profile in database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        role_id: roleData.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        is_verified: true, // Auto-verify for development
        verification_token: crypto.randomBytes(32).toString('hex')
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.error('errors.serverError', 400, 'Error creating user profile');
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: authData.user.id, email: authData.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.success({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName,
        lastName,
        phone,
        role
      },
      profile,
      token
    }, 'auth.registerSuccess', 201);

  } catch (error) {
    console.error('Registration error:', error);
    res.error('errors.serverError', 500, error.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.error('errors.validationError', 400, 'Please provide email and password');
    }

    // Create a temporary client for this user to sign in
    const { createClient } = require('@supabase/supabase-js');
    const userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Sign in with email and password
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return res.error('auth.invalidCredentials', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, roles(*)')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.error('auth.invalidCredentials', 401);
    }

    // Update last login
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id);

    // Get lawyer profile if user is a lawyer
    let lawyerProfile = null;
    if (profile.roles?.name === 'lawyer') {
      const { data: lawyer } = await supabaseAdmin
        .from('lawyer_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      lawyerProfile = lawyer;
    }

    // Use the session token from Supabase
    const token = authData.session?.access_token || authData.user.id;

    res.success({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        role: profile.roles?.name,
        isVerified: profile.is_verified,
        profileImageUrl: profile.profile_image_url
      },
      profile,
      lawyerProfile,
      token,
      refreshToken: authData.session?.refresh_token
    }, 'auth.loginSuccess');

  } catch (error) {
    console.error('Login error:', error);
    res.error('errors.serverError', 500, error.message);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*, roles(*)')
      .eq('user_id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    let lawyerProfile = null;
    if (profile.roles?.name === 'lawyer') {
      const { data: lawyer } = await supabaseAdmin
        .from('lawyer_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      lawyerProfile = lawyer;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        profile,
        lawyerProfile
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, profileImageUrl, bio } = req.body;
    const userId = req.user.id;

    // Get current profile
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Update profile
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (phone) updateData.phone = phone;
    if (profileImageUrl) updateData.profile_image_url = profileImageUrl;
    if (bio) updateData.bio = bio;
    
    if (address) {
      updateData.address_street = address.street;
      updateData.address_city = address.city;
      updateData.address_state = address.state;
      updateData.address_zip_code = address.zipCode;
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select('*, roles(*)')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error updating profile'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Send password reset email via Supabase
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide refresh token'
      });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Sign out from Supabase (optional - mainly for client-side)
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};
