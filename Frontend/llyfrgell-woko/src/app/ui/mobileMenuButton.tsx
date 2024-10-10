import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

interface Props {
    onClick: () => void;
}

const MobileMenuButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button className="absolute right-2 top-2 p-2" onClick={onClick}>
      <FontAwesomeIcon className="text-4xl" icon={faBars} />
    </button>
  );
}

export {
    MobileMenuButton
}