import useLanguage from '@/locale/useLanguage';
import ReadSolarProjectModule from '@/modules/SolarProjectModule/ReadSolarProjectModule';

export default function SolarProjectRead() {
    const translate = useLanguage();
    const entity = 'solarProject';
    const Labels = {
        PANEL_TITLE: 'Solar Project Details',
        DATATABLE_TITLE: 'Solar Projects List',
        ENTITY_NAME: 'Solar Project',
    };

    const configPage = {
        entity,
        ...Labels,
    };
    return <ReadSolarProjectModule config={configPage} />;
}
