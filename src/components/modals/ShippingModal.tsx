import DocumentModal from './DocumentModal';
import { legalContent } from '../../data/legalData';

/**
 * Shipping policy modal — document style
 */
export default function ShippingModal(): React.ReactElement {
    return <DocumentModal document={legalContent.shippingPolicy} />;
}
