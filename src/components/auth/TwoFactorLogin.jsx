import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Shield, Key, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { loginUser } from '../../api/user.api.js';

const TwoFactorLogin = ({ email, password, onSuccess, onBack, redirectTo }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!useBackupCode && (!verificationCode || verificationCode.length !== 6)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    if (useBackupCode && !backupCode) {
      toast.error('Please enter a backup code');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(
        email,
        password,
        useBackupCode ? undefined : verificationCode,
        useBackupCode ? backupCode : undefined
      );

      toast.success('Login successful!');
      onSuccess(response, redirectTo);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Two-Factor Authentication</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            {useBackupCode 
              ? 'Enter one of your backup codes to continue'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
          {redirectTo && (
            <p className="text-blue-600 text-xs mt-2">
              🎥 You'll be redirected to your studio session after verification
            </p>
          )}
        </div>

        {!useBackupCode ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg font-mono"
                autoFocus
              />
            </div>
            
            <Button 
              variant="link" 
              onClick={() => setUseBackupCode(true)}
              className="w-full text-sm"
            >
              <Key className="w-4 h-4 mr-2" />
              Use backup code instead
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code
              </label>
              <Input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 8))}
                onKeyPress={handleKeyPress}
                placeholder="Enter backup code"
                maxLength={8}
                className="text-center text-lg font-mono"
                autoFocus
              />
            </div>
            
            <Button 
              variant="link" 
              onClick={() => setUseBackupCode(false)}
              className="w-full text-sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Use authenticator app instead
            </Button>
          </div>
        )}

        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleVerify}
            disabled={loading || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && !backupCode)}
            className="flex-1"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Lost access to your authenticator? Contact support for help.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorLogin;
