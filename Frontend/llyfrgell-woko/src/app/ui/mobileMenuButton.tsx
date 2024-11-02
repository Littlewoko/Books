import { Menu } from '@mui/icons-material';

interface Props {
    onClick: () => void;
}

const MobileMenuButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button className="mr-4 pb-2" onClick={onClick}>
      <Menu className="text-3xl" sx={{color: "black"}}/>
    </button>
  );
}

export {
    MobileMenuButton
}