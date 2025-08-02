import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Shield, ShieldCheck, Key, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '../../utils/axios.js';

const TwoFactorSetup = ({ user, onClose }) => {
  const [step, setStep] = useState('status'); // status, setup, verify, backup
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    twoFactorEnabled: false,
    hasBackupCodes: false,
    unusedBackupCodes: 0
  });
  const [password, setPassword] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/2fa/status');
      setTwoFactorStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
      toast.error('Failed to fetch 2FA status');
    }
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/2fa/setup');
      
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep('setup');
      toast.success('2FA setup initiated');
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/2fa/enable', {
        token: verificationCode
      });
      
      setBackupCodes(response.data.backupCodes);
      setStep('backup');
      toast.success('2FA enabled successfully!');
      fetchTwoFactorStatus();
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      toast.error('Password is required to disable 2FA');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/2fa/disable', {
        password
      });
      
      toast.success('2FA disabled successfully');
      setPassword('');
      fetchTwoFactorStatus();
      setStep('status');
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!password) {
      toast.error('Password is required to regenerate backup codes');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/2fa/backup-codes', {
        password
      });
      
      setBackupCodes(response.data.backupCodes);
      setStep('backup');
      setPassword('');
      toast.success('Backup codes regenerated successfully');
      fetchTwoFactorStatus();
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success('Backup codes copied to clipboard');
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const renderStatusStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {twoFactorStatus.twoFactorEnabled ? (
            <ShieldCheck className="w-8 h-8 text-green-500" />
          ) : (
            <Shield className="w-8 h-8 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-600">
              {twoFactorStatus.twoFactorEnabled 
                ? 'Your account is protected with 2FA'
                : 'Add an extra layer of security to your account'
              }
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          twoFactorStatus.twoFactorEnabled 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {twoFactorStatus.twoFactorEnabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {twoFactorStatus.twoFactorEnabled ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-800">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">2FA is active</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              You have {twoFactorStatus.unusedBackupCodes} unused backup codes remaining.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (required for changes)
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleRegenerateBackupCodes}
                disabled={loading || !password}
              >
                <Key className="w-4 h-4 mr-2" />
                Regenerate Backup Codes
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDisable2FA}
                disabled={loading || !password}
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900">Why enable 2FA?</h4>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>• Protects your account even if your password is compromised</li>
              <li>• Uses time-based codes from your authenticator app</li>
              <li>• Includes backup codes for account recovery</li>
            </ul>
          </div>
          
          <Button onClick={handleSetup2FA} disabled={loading} className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            Enable Two-Factor Authentication
          </Button>
        </div>
      )}
    </div>
  );

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
        <p className="text-gray-600 text-sm">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg border">
          <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Can't scan? Enter this code manually:
        </p>
        <code className="text-xs bg-white px-2 py-1 rounded border font-mono">
          {secret}
        </code>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter verification code from your app
          </label>
          <Input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-lg font-mono"
          />
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setStep('status')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyAndEnable}
            disabled={loading || verificationCode.length !== 6}
            className="flex-1"
          >
            Verify & Enable
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Save Your Backup Codes</h3>
        <p className="text-gray-600 text-sm">
          Store these codes safely. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-yellow-800 text-sm">
            <p className="font-medium">Important:</p>
            <ul className="mt-1 space-y-1">
              <li>• Each code can only be used once</li>
              <li>• Store them in a secure location</li>
              <li>• Don't share them with anyone</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-700">Backup Codes</h4>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={copyBackupCodes}
            className="flex items-center space-x-1"
          >
            {copiedCodes ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedCodes ? 'Copied!' : 'Copy All'}</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <code key={index} className="bg-white px-3 py-2 rounded border text-sm font-mono">
              {code}
            </code>
          ))}
        </div>
      </div>

      <Button onClick={() => { setStep('status'); onClose?.(); }} className="w-full">
        I've Saved My Backup Codes
      </Button>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Two-Factor Authentication</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'status' && renderStatusStep()}
        {step === 'setup' && renderSetupStep()}
        {step === 'backup' && renderBackupStep()}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
