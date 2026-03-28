import { Menu } from '@mui/icons-material';

interface Props {
    onClick: () => void;
}

const MobileMenuButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button className="text-amber-100/70 hover:text-amber-100 transition-colors" onClick={onClick}>
      <Menu sx={{ fontSize: 26, color: 'inherit' }} />
    </button>
  );
}

export {
    MobileMenuButton
}
