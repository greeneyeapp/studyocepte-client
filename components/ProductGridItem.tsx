// components/ProductGridItem.tsx - Optimized Product Item
interface ProductGridItemProps {
  product: Product;
  onPress: () => void;
  style?: any;
  priority?: 'low' | 'normal' | 'high';
}

const ProductGridItem: React.FC<ProductGridItemProps> = ({
  product,
  onPress,
  style,
  priority = 'normal'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <View style={[styles.itemContainer, style]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card padding="none">
          <View style={styles.imageContainer}>
            <LazyImage
              uri={product.coverThumbnailUrl || ''}
              style={styles.productImage}
              priority={priority}
              onLoad={() => setImageLoaded(true)}
              placeholder={
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              }
            />
            {!imageLoaded && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="small" color={Colors.card} />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.photoCount}>
              {product.photoCount} fotoğraf
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({

  // ProductGridItem styles
  itemContainer: {
    flex: 1,
    margin: GRID_SPACING / 2,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  productInfo: {
    padding: Spacing.md,
  },
  productName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  photoCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },


  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modalCancel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalClear: {
    ...Typography.body,
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sortButtonTextActive: {
    color: Colors.card,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...Typography.bodyMedium,
    color: Colors.card,
    fontWeight: '600',
  },
});