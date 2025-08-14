// features/editor/components/DraftManager.tsx - DRAFT YÖNETİM COMPONENT'İ
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useDraftRestore, draftUtils } from '../hooks/useDraftRestore';
import { useEnhancedEditorStore, PhotoDraft } from '@/stores/useEnhancedEditorStore';
import { ToastService } from '@/components/Toast/ToastService';
import { useTranslation } from 'react-i18next'; // useTranslation import edildi

interface DraftListItemProps {
  draft: PhotoDraft;
  onRestore: (draft: PhotoDraft) => void;
  onDelete: (photoId: string) => void;
}

const DraftListItem: React.FC<DraftListItemProps> = ({ draft, onRestore, onDelete }) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const { changedSettings, hasSignificantChanges } = draftUtils.analyzeDraftChanges(draft);
  const ageText = draftUtils.formatDraftAge(draft.timestamp, t); // t prop'u geçirildi
  const sizeText = draftUtils.estimateDraftSize(draft);

  return (
    <View style={styles.draftItem}>
      <View style={styles.draftInfo}>
        <Text style={styles.draftTitle}>{t('editor.draftManager.photoId', { id: draft.photoId.slice(-8) })}</Text> {/* Lokalize edildi */}
        <Text style={styles.draftSubtitle}>
          {t('editor.draftManager.changes', { count: changedSettings })} • {ageText} • {sizeText} {/* Lokalize edildi */}
        </Text>
        {hasSignificantChanges && (
          <View style={styles.significantBadge}>
            <Text style={styles.significantText}>{t('editor.draftManager.significantChanges')}</Text> {/* Lokalize edildi */}
          </View>
        )}
        {draft.autoSaved && (
          <View style={styles.autoSavedBadge}>
            <Feather name="clock" size={10} color={Colors.primary} />
            <Text style={styles.autoSavedText}>{t('editor.draftManager.autoSaved')}</Text> {/* Lokalize edildi */}
          </View>
        )}
      </View>
      
      <View style={styles.draftActions}>
        <TouchableOpacity 
          style={styles.restoreButton} 
          onPress={() => onRestore(draft)}
          activeOpacity={0.7}
        >
          <Feather name="rotate-ccw" size={16} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => onDelete(draft.photoId)}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface DraftManagerProps {
  visible: boolean;
  onClose: () => void;
}

export const DraftManager: React.FC<DraftManagerProps> = ({ visible, onClose }) => {
  const { t } = useTranslation(); // t hook'u kullanıldı
  const { availableDrafts, handleManualRestore, refreshDrafts } = useDraftRestore();
  const { clearDraftForPhoto } = useEnhancedEditorStore();

  const handleDelete = useCallback((photoId: string) => {
    clearDraftForPhoto(photoId);
    refreshDrafts();
    ToastService.show(t('editor.draftManager.draftClearSuccess')); // Lokalize edildi
  }, [clearDraftForPhoto, refreshDrafts, t]);

  const handleClearAll = useCallback(() => {
    availableDrafts.forEach(draft => {
      clearDraftForPhoto(draft.photoId);
    });
    refreshDrafts();
    ToastService.show(t('editor.draftManager.multipleDraftsCleared', { count: availableDrafts.length })); // Lokalize edildi
    onClose();
  }, [availableDrafts, clearDraftForPhoto, refreshDrafts, onClose, t]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('editor.draftManager.title')}</Text> {/* Lokalize edildi */}
          <View style={styles.headerActions}>
            {availableDrafts.length > 0 && (
              <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton}>
                <Text style={styles.clearAllText}>{t('editor.draftManager.clearAll')}</Text> {/* Lokalize edildi */}
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {availableDrafts.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="file-text" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>{t('editor.draftManager.noDrafts')}</Text> {/* Lokalize edildi */}
              <Text style={styles.emptySubtitle}>
                {t('editor.draftManager.noDraftsSubtitle')} {/* Lokalize edildi */}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {t('editor.draftManager.totalDrafts', { count: availableDrafts.length, autoSaved: availableDrafts.filter(d => d.autoSaved).length })} {/* Lokalize edildi */}
                </Text>
              </View>
              {availableDrafts.map((draft) => (
                <DraftListItem
                  key={draft.photoId}
                  draft={draft}
                  onRestore={handleManualRestore}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  clearAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.md,
  },
  
  clearAllText: {
    ...Typography.captionMedium,
    color: Colors.error,
    fontWeight: '600',
  },
  
  closeButton: {
    padding: Spacing.xs,
  },
  
  content: {
    maxHeight: 400,
  },
  
  statsContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  statsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  draftItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  draftInfo: {
    flex: 1,
  },
  
  draftTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  
  draftSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  significantBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  
  significantText: {
    ...Typography.caption,
    color: Colors.warning,
    fontSize: 10,
    fontWeight: '600',
  },
  
  autoSavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: Spacing.xs / 2,
  },
  
  autoSavedText: {
    ...Typography.caption,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  
  draftActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  
  restoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emptyState: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});