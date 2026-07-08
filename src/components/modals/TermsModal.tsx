import DocumentModal from './DocumentModal';
import { legalContent } from '../../data/legalData';

/**
 * Terms and exchanges policy modal — document style
 */
export default function TermsModal(): React.ReactElement {
    return <DocumentModal document={legalContent.termsAndExchanges} />;
}
