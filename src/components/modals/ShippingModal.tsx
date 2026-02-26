import { legalContent } from '../../data/legalData';
import DocumentModal from './DocumentModal';

/**
 * Shipping policy modal — document style
 */
export default function ShippingModal(): React.ReactElement {
    return <DocumentModal document={legalContent.shippingPolicy} />;
}
