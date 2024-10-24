import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

interface Props {
    onClick: () => void;
}

const MobileMenuButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button className="mr-4 pb-2" onClick={onClick}>
      <FontAwesomeIcon className="text-3xl" icon={faBars} />
    </button>
  );
}

export {
    MobileMenuButton
}