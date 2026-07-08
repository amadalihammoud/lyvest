import DocumentModal from './DocumentModal';
import { legalContent } from '../../data/legalData';

/**
 * Privacy policy modal — document style
 */
export default function PrivacyModal(): React.ReactElement {
    return <DocumentModal document={legalContent.privacyPolicy} />;
}
