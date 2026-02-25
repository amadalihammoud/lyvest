import { legalContent } from '../../data/legalData';
import DocumentModal from './DocumentModal';

/**
 * Privacy policy modal — document style
 */
export default function PrivacyModal(): React.ReactElement {
    return <DocumentModal document={legalContent.privacyPolicy} />;
}
