import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [telegramChatId, setTelegramChatId] = useState('');
  const [thresholdPercent, setThresholdPercent] = useState('0.200');
  const [frequencyMinutes, setFrequencyMinutes] = useState('60');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/notifications/settings'],
    enabled: isOpen,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/notifications/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] });
      toast({
        title: t('notifications.save'),
        description: 'Настройки уведомлений сохранены',
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('common.error'),
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    },
  });

  // Initialize form with existing settings
  React.useEffect(() => {
    if (settings) {
      setThresholdPercent(settings.thresholdPercent || '0.200');
      setFrequencyMinutes(settings.frequencyMinutes?.toString() || '60');
      setTelegramEnabled(settings.telegramEnabled || false);
      setEmailEnabled(settings.emailEnabled || false);
    }
  }, [settings]);

  const handleSave = () => {
    saveMutation.mutate({
      thresholdPercent: parseFloat(thresholdPercent),
      frequencyMinutes: parseInt(frequencyMinutes),
      telegramEnabled,
      emailEnabled,
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-400">{t('common.loading')}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('notifications.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Telegram Bot */}
          <div className="space-y-3">
            <Label className="text-white">{t('notifications.telegram')}</Label>
            <div className="flex items-center space-x-3">
              <Input
                type="text"
                placeholder={t('notifications.telegramPlaceholder')}
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-gray-400"
              />
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!telegramChatId.trim()}
              >
                {t('notifications.connect')}
              </Button>
            </div>
          </div>
          
          {/* Email Notifications */}
          <div className="space-y-3">
            <Label className="text-white">{t('notifications.email')}</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-enabled"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
                className="border-slate-600 data-[state=checked]:bg-blue-500"
              />
              <Label htmlFor="email-enabled" className="text-sm text-gray-300">
                {t('notifications.sendToEmail').replace('{{email}}', user?.email || 'example@email.com')}
              </Label>
            </div>
          </div>
          
          {/* Thresholds */}
          <div className="space-y-3">
            <Label className="text-white">{t('notifications.thresholds')}</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-300">
                  {t('notifications.notifyWhen')}
                </Label>
                <Input
                  type="number"
                  step="0.001"
                  value={thresholdPercent}
                  onChange={(e) => setThresholdPercent(e.target.value)}
                  className="w-20 bg-slate-800 border-slate-600 text-white text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-300">
                  {t('notifications.frequency')}
                </Label>
                <Select value={frequencyMinutes} onValueChange={setFrequencyMinutes}>
                  <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="60" className="text-gray-300">
                      {t('notifications.hourly')}
                    </SelectItem>
                    <SelectItem value="30" className="text-gray-300">
                      {t('notifications.every30min')}
                    </SelectItem>
                    <SelectItem value="15" className="text-gray-300">
                      {t('notifications.every15min')}
                    </SelectItem>
                    <SelectItem value="1" className="text-gray-300">
                      {t('notifications.instant')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-600 text-gray-300 hover:bg-slate-800"
          >
            {t('notifications.cancel')}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveMutation.isPending ? t('common.loading') : t('notifications.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
