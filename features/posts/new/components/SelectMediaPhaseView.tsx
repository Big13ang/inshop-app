import SelectedMediaSlider from "./SelectedMediaSlider";
import SelectedGallery from "./SelectedGallery";

export const SelectMediaPhaseView = () => {
    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <SelectedMediaSlider aspectClassName="aspect-square" />
            <div className="flex-1 min-h-0 overflow-y-auto pb-20">
                <SelectedGallery />
            </div>
        </div>
    );
};

export default SelectMediaPhaseView;
