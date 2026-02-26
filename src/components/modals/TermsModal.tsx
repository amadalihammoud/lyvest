import { legalContent } from '../../data/legalData';
import DocumentModal from './DocumentModal';

/**
 * Terms and exchanges policy modal — document style
 */
export default function TermsModal(): React.ReactElement {
    return <DocumentModal document={legalContent.termsAndExchanges} />;
}
