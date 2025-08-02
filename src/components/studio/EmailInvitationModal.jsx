import React, { useState } from 'react';
import { X, Mail, Plus, Trash2, Send, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { sendRoomInvitation, sendBulkInvitations } from '../../api/email.api';

const EmailInvitationModal = ({ 
  isOpen, 
  onClose, 
  session, 
  currentUser 
}) => {
  const [invitationMode, setInvitationMode] = useState('single'); // 'single' or 'bulk'
  const [singleGuest, setSingleGuest] = useState({ email: '', name: '' });
  const [bulkGuests, setBulkGuests] = useState([{ email: '', name: '' }]);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate room link
  const roomLink = `${window.location.origin}/auth?redirect=${encodeURIComponent(`/studio/${session?.roomId}`)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      toast.success('Room link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const addBulkGuest = () => {
    setBulkGuests([...bulkGuests, { email: '', name: '' }]);
  };

  const removeBulkGuest = (index) => {
    if (bulkGuests.length > 1) {
      setBulkGuests(bulkGuests.filter((_, i) => i !== index));
    }
  };

  const updateBulkGuest = (index, field, value) => {
    const updated = bulkGuests.map((guest, i) => 
      i === index ? { ...guest, [field]: value } : guest
    );
    setBulkGuests(updated);
  };

  const handleSendInvitation = async () => {
    setIsLoading(true);
    
    try {
      if (invitationMode === 'single') {
        if (!singleGuest.email) {
          toast.error('Please enter a guest email address');
          return;
        }

        const result = await sendRoomInvitation({
          guestEmail: singleGuest.email,
          guestName: singleGuest.name,
          roomId: session.roomId,
          roomTitle: session.title || `${currentUser?.name}'s Room`,
          customMessage: customMessage.trim() || undefined
        });

        toast.success('Invitation sent successfully!');
        setSingleGuest({ email: '', name: '' });
        
      } else {
        // Bulk invitations
        const validGuests = bulkGuests.filter(guest => guest.email.trim());
        
        if (validGuests.length === 0) {
          toast.error('Please enter at least one guest email address');
          return;
        }

        const result = await sendBulkInvitations({
          guests: validGuests,
          roomId: session.roomId,
          roomTitle: session.title || `${currentUser?.name}'s Room`,
          customMessage: customMessage.trim() || undefined
        });

        if (result.success) {
          toast.success(`Sent ${result.summary.successful} invitation(s) successfully!`);
        } else {
          toast.warning(`Sent ${result.summary.successful} invitations, ${result.summary.failed} failed`);
        }

        setBulkGuests([{ email: '', name: '' }]);
      }

      setCustomMessage('');
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSingleGuest({ email: '', name: '' });
    setBulkGuests([{ email: '', name: '' }]);
    setCustomMessage('');
    setInvitationMode('single');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 rounded-xl border border-stone-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-700">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Invite Guests</h2>
              <p className="text-sm text-stone-400">
                Send email invitations to join your room
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Room Info */}
            <div className="bg-stone-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Room Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-400">Room ID:</span>
                  <Badge variant="secondary" className="font-mono">
                    {session?.roomId}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Host:</span>
                  <span className="text-white">{currentUser?.name}</span>
                </div>
              </div>
              
              {/* Room Link */}
              <div className="mt-4">
                <Label className="text-stone-300 text-xs">Direct Room Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={roomLink}
                    readOnly
                    className="bg-stone-700 border-stone-600 text-stone-300 text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="border-stone-600 hover:border-stone-500"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <Label className="text-white">Invitation Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={invitationMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInvitationMode('single')}
                  className="flex-1"
                >
                  Single Guest
                </Button>
                <Button
                  variant={invitationMode === 'bulk' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInvitationMode('bulk')}
                  className="flex-1"
                >
                  Multiple Guests
                </Button>
              </div>
            </div>

            {/* Single Guest Form */}
            {invitationMode === 'single' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guest-email" className="text-stone-300">
                      Guest Email *
                    </Label>
                    <Input
                      id="guest-email"
                      type="email"
                      placeholder="guest@example.com"
                      value={singleGuest.email}
                      onChange={(e) => setSingleGuest({ ...singleGuest, email: e.target.value })}
                      className="bg-stone-800 border-stone-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-name" className="text-stone-300">
                      Guest Name (Optional)
                    </Label>
                    <Input
                      id="guest-name"
                      placeholder="John Doe"
                      value={singleGuest.name}
                      onChange={(e) => setSingleGuest({ ...singleGuest, name: e.target.value })}
                      className="bg-stone-800 border-stone-600 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Guests Form */}
            {invitationMode === 'bulk' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-stone-300">Guest List</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addBulkGuest}
                    className="border-stone-600 hover:border-stone-500"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Guest
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {bulkGuests.map((guest, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="guest@example.com"
                        value={guest.email}
                        onChange={(e) => updateBulkGuest(index, 'email', e.target.value)}
                        className="bg-stone-800 border-stone-600 text-white flex-1"
                      />
                      <Input
                        placeholder="Name (optional)"
                        value={guest.name}
                        onChange={(e) => updateBulkGuest(index, 'name', e.target.value)}
                        className="bg-stone-800 border-stone-600 text-white flex-1"
                      />
                      {bulkGuests.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBulkGuest(index)}
                          className="border-red-600 hover:border-red-500 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="custom-message" className="text-stone-300">
                Custom Message (Optional)
              </Label>
              <Textarea
                id="custom-message"
                placeholder="Add a personal message to your invitation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="bg-stone-800 border-stone-600 text-white resize-none"
                rows={3}
              />
              <p className="text-xs text-stone-500">
                This message will be included in the invitation email
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-stone-600 hover:border-stone-500"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendInvitation}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send {invitationMode === 'bulk' ? 'Invitations' : 'Invitation'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailInvitationModal;
