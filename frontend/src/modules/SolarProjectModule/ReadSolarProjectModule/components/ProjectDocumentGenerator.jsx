import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  notification,
  Empty,
} from 'antd';
import dayjs from 'dayjs';
import { DownloadOutlined, FileOutlined, FileWordOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '@/request';

const { Title, Text } = Typography;

const DOCUMENT_FOLDERS = [
  { key: 'annexure', name: 'Annexure Document', status: 'ready' },
  { key: 'model-agreement', name: 'Model Agreement', status: 'ready' },
  { key: 'net-metering', name: 'Net Metering', status: 'ready' },
  { key: 'undertaking', name: 'Undertaking', status: 'ready' },
  { key: 'work-completion', name: 'Work Completion', status: 'ready' },
];

function formatDate(value, format = 'DD MMM YYYY') {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format(format) : '-';
}

function getInitialValues(project) {
  const capacity = project?.systemDetails?.capacity ? parseFloat(project.systemDetails.capacity) : undefined;
  const solarPanelWatt = project?.systemDetails?.solarPanelWatt ? parseFloat(project.systemDetails.solarPanelWatt) : undefined;

  return {
    beneficiaryName: project?.client || '',
    consumerNumber: project?.consumerNumber || '',
    mobileNumber: project?.contactNumber || '',
    email: project?.email || '',
    installationAddressLine1: project?.address || '',
    installationAddressLine2: '',
    installationAddressLine3: '',
    addressPostalLine: project?.pinCode || '',
    siteAddressSentence: '',
    reArrangementType: 'Net Metering Arrangement',
    reSource: 'Solar Roof top',
    sanctionedCapacityKw: capacity,
    capacityType: 'Rooftop',
    projectModel: 'Capex',
    rooftopInstalledCapacityKw: project?.systemDetails?.capacity || 'NA',
    rooftopGroundInstalledCapacityKw: 'NA',
    groundInstalledCapacityKw: 'NA',
    installationDate: project?.completionDetails?.completionDate ? dayjs(project.completionDetails.completionDate) : null,
    inverterCapacityKw: capacity,
    inverterMake: project?.systemDetails?.inverterName || '',
    pvModules: project?.systemDetails?.solarPanelNos || undefined,
    moduleCapacityKw: solarPanelWatt ? solarPanelWatt / 1000 : undefined,
    agencyName: 'PARIKH RENEWABLE PRIVATE LIMITED',
    inspectionDate: project?.completionDetails?.completionDate ? dayjs(project.completionDetails.completionDate) : null,
    officerName: '',
    officerDesignation: '',
    officerSealDate: null,
  };
}

function getModelAgreementInitialValues(project) {
  return {
    agreementDate: null,
    consumerName: project?.client || '',
    consumerNumber: project?.consumerNumber || '',
    discomName: 'MSEDCL',
    applicantAddress: project?.address || '',
    vendorCompanyName: 'PARIKH RENEWABLE PRIVATE LIMITED',
    vendorRegisteredAddress: '',
    sanctionedCapacityKwp: project?.systemDetails?.capacity || '3',
    moduleMake: project?.systemDetails?.solarPanelName || 'WAAREE',
    moduleModel: 'BI-60-580',
    moduleWattage: project?.systemDetails?.solarPanelWatt || '580',
    moduleEfficiency: '21.68%',
    inverterMake: project?.systemDetails?.inverterName || 'WAAREE',
    inverterModel: 'W1-3.3 K-G3',
    inverterRatedCapacityKwp: project?.systemDetails?.capacity || '3.3',
    totalProjectCost: project?.paymentDetails?.totalProjectCost ? `${project.paymentDetails.totalProjectCost}/-` : '1,77,000/-',
    advancePaymentPercentage: '20%',
    piPaymentPercentage: '40%',
    installationPaymentPercentage: '40%',
    maintenancePeriodYears: 'Five years',
    cancellationFeePercentage: '10%',
    warrantyYears: 'Ten years',
  };
}

function getNetMeteringInitialValues(project) {
  return {
    agreementDate: null,
    agreementPlaceLine1: 'CHHATRAPATI',
    agreementPlaceLine2: 'SAMBHAJINAGAR',
    consumerName: project?.client || '',
    consumerAddressLine1: project?.address || '',
    consumerAddressLine2: '',
    consumerAddressLine3: '',
    consumerNumber: project?.consumerNumber || '',
    licenseeName: 'Maharashtra State Electricity Distribution Co. Ltd',
    licenseeOffice: 'CHHATRAPATI SAMBHAJINAGAR',
    sanctionedCapacityKw: project?.systemDetails?.capacity ? parseFloat(project.systemDetails.capacity) : 3,
    vendorName: 'PARIKH RENEWABLE PRIVATE LIMITED',
  };
}

function getUndertakingInitialValues(project) {
  return {
    companyName: 'PARIKH RENEWABLE PRIVATE LIMITED',
    installedCapacityKw: project?.systemDetails?.capacity || '3 KW',
    consumerName: project?.client || '',
    location: project?.proejctCity || project?.city || '',
    applicationNumber: project?.solarRooftopApplicationNo || '',
    agreementDate: null,
    moduleCapacityWp: project?.systemDetails?.solarPanelWatt || '580',
    moduleCount: project?.systemDetails?.solarPanelNos ? `${project.systemDetails.solarPanelNos} Nos` : '',
    moduleSerialNumbers: project?.completionDetails?.solarPanelSerialNumbers?.join(', ') || '',
    moduleMake: project?.systemDetails?.solarPanelName || 'WAAREE ENERGIES LIMITED',
    cellManufacturer: 'WAAREE ENERGIES LIMITED',
    cellGstInvoiceNo: '',
    signatoryName: 'ADITYA SURESH PARIKH',
    signatoryDesignation: 'DIRECTOR',
    phoneNumber: '7083366625',
    email: 'parikhrenewable@gmail.com',
  };
}

function getWorkCompletionInitialValues(project) {
  return {
    companyName: 'PARIKH RENEWABLE PRIVATE LIMITED',
    consumerName: project?.client || '',
    consumerNumber: project?.consumerNumber || '',
    siteAddressLine1: project?.address || '',
    siteAddressLine2: '',
    siteAddressLine3: '',
    siteAddressLine4: '',
    category: 'PRIVATE SECTOR',
    sanctionNumber: '',
    installedCapacity: project?.systemDetails?.capacity || '3 KW',
    capacity: project?.systemDetails?.capacity || '3 KW',
    moduleType: 'BIFACIAL',
    moduleMake: project?.systemDetails?.solarPanelName || 'WAAREE',
    moduleWattage: project?.systemDetails?.solarPanelWatt ? `${project.systemDetails.solarPanelWatt} WP` : '',
    moduleCount: project?.systemDetails?.solarPanelNos ? `${project.systemDetails.solarPanelNos} nos` : '',
    moduleEfficiency: '21.68%',
    moduleTotalCapacity: '',
    inverterDetails: project?.systemDetails?.inverterName || '',
    inverterRating: '',
    controllerType: '1 MPPT',
    inverterCapacity: project?.systemDetails?.capacity || '',
    yearOfManufacture: '',
    earthingDetails: 'DC:1. 7, AC :1. 7, LA :1.2',
    lighteningArrester: 'YES',
    signatoryName: 'ADITYA SURESH PARIKH',
    signatoryDesignation: 'DIRECTOR',
    warrantyText:
      'The undersigned will provide the services to the consumers for repairs/maintenance of the RIS plant free of cost for 5 years of the comprehensive Maintenance Contract (CMC) period from the date of commissioning of the plant. Non performing/under-performing system component will be replaced Repaired free of cost in the CMC period.',
    identityName: project?.client || '',
    identityAddress: project?.address || '',
    identityAadhar: '',
  };
}

function useTemplatePreview(values) {
  const lines = [
    values.installationAddressLine1,
    values.installationAddressLine2,
    values.installationAddressLine3,
    values.addressPostalLine,
  ].filter(Boolean);

  return {
    beneficiaryName: values.beneficiaryName || '-',
    consumerNumber: values.consumerNumber || '-',
    mobileNumber: values.mobileNumber || '-',
    email: values.email || '-',
    addressLines: lines,
    siteAddressSentence: values.siteAddressSentence || (lines.length ? `AT ${lines.join(' ')}` : '-'),
    reArrangementType: values.reArrangementType || '-',
    reSource: values.reSource || '-',
    sanctionedCapacityKw: values.sanctionedCapacityKw ? `${values.sanctionedCapacityKw} kW` : '-',
    capacityType: values.capacityType || '-',
    projectModel: values.projectModel || '-',
    rooftopInstalledCapacityKw: values.rooftopInstalledCapacityKw || 'NA',
    rooftopGroundInstalledCapacityKw: values.rooftopGroundInstalledCapacityKw || 'NA',
    groundInstalledCapacityKw: values.groundInstalledCapacityKw || 'NA',
    installationDate: formatDate(values.installationDate),
    inverterCapacityKw: values.inverterCapacityKw ? `${values.inverterCapacityKw} KW` : '-',
    inverterMake: values.inverterMake || '-',
    pvModules: values.pvModules ? `${values.pvModules} Nos` : '-',
    moduleCapacityKw: values.moduleCapacityKw ? `${values.moduleCapacityKw} KW` : '-',
    agencyName: values.agencyName || '-',
    inspectionDate: formatDate(values.inspectionDate),
    officerName: values.officerName || '-',
    officerDesignation: values.officerDesignation || '-',
    officerSealDate: formatDate(values.officerSealDate, 'DD MMM YYYY'),
  };
}

function useModelAgreementPreview(values) {
  return {
    agreementDate: formatDate(values.agreementDate, 'DD MMM YYYY'),
    consumerName: values.consumerName || '-',
    consumerNumber: values.consumerNumber || '-',
    discomName: values.discomName || '-',
    applicantAddress: values.applicantAddress || '-',
    vendorCompanyName: values.vendorCompanyName || '-',
    vendorRegisteredAddress: values.vendorRegisteredAddress || '-',
    sanctionedCapacityKwp: values.sanctionedCapacityKwp || '-',
    moduleMake: values.moduleMake || '-',
    moduleModel: values.moduleModel || '-',
    moduleWattage: values.moduleWattage || '-',
    moduleEfficiency: values.moduleEfficiency || '-',
    inverterMake: values.inverterMake || '-',
    inverterModel: values.inverterModel || '-',
    inverterRatedCapacityKwp: values.inverterRatedCapacityKwp || '-',
    totalProjectCost: values.totalProjectCost || '-',
    advancePaymentPercentage: values.advancePaymentPercentage || '-',
    piPaymentPercentage: values.piPaymentPercentage || '-',
    installationPaymentPercentage: values.installationPaymentPercentage || '-',
    maintenancePeriodYears: values.maintenancePeriodYears || '-',
    cancellationFeePercentage: values.cancellationFeePercentage || '-',
    warrantyYears: values.warrantyYears || '-',
  };
}

function formatNetMeteringDate(value) {
  if (!value) return '05/ 11 /2025';
  const date = dayjs(value);
  if (!date.isValid()) return '05/ 11 /2025';
  return `${date.format('DD')}/ ${date.format('MM')} /${date.format('YYYY')}`;
}

function useNetMeteringPreview(values) {
  const consumerAddressLines = [
    values.consumerAddressLine1,
    values.consumerAddressLine2,
    values.consumerAddressLine3,
  ].filter(Boolean);

  return {
    agreementDate: formatNetMeteringDate(values.agreementDate),
    agreementPlaceLine1: values.agreementPlaceLine1 || 'CHHATRAPATI',
    agreementPlaceLine2: values.agreementPlaceLine2 || 'SAMBHAJINAGAR',
    consumerName: values.consumerName || '-',
    consumerAddressLines,
    consumerNumber: values.consumerNumber || '-',
    licenseeName: values.licenseeName || '-',
    licenseeOffice: values.licenseeOffice || '-',
    sanctionedCapacityKw: values.sanctionedCapacityKw ? `${values.sanctionedCapacityKw} ` : '-',
    vendorName: values.vendorName || '-',
  };
}

function formatUndertakingDate(value) {
  if (!value) return '05-Nov-2025';
  const date = dayjs(value);
  if (!date.isValid()) return '05-Nov-2025';
  return date.format('DD-MMM-YYYY');
}

function useUndertakingPreview(values) {
  return {
    companyName: values.companyName || '-',
    installedCapacityKw: values.installedCapacityKw || '-',
    consumerName: values.consumerName || '-',
    location: values.location || '-',
    applicationNumber: values.applicationNumber || '-',
    agreementDate: formatUndertakingDate(values.agreementDate),
    moduleCapacityWp: values.moduleCapacityWp || '-',
    moduleCount: values.moduleCount || '-',
    moduleSerialNumbers: values.moduleSerialNumbers || '-',
    moduleMake: values.moduleMake || '-',
    cellManufacturer: values.cellManufacturer || '-',
    cellGstInvoiceNo: values.cellGstInvoiceNo || '-',
    signatoryName: values.signatoryName || '-',
    signatoryDesignation: values.signatoryDesignation || '-',
    phoneNumber: values.phoneNumber || '-',
    email: values.email || '-',
  };
}

function useWorkCompletionPreview(values) {
  return {
    companyName: values.companyName || '-',
    consumerName: values.consumerName || '-',
    consumerNumber: values.consumerNumber || '-',
    siteAddressLine1: values.siteAddressLine1 || '-',
    siteAddressLine2: values.siteAddressLine2 || '-',
    siteAddressLine3: values.siteAddressLine3 || '-',
    siteAddressLine4: values.siteAddressLine4 || '-',
    category: values.category || '-',
    sanctionNumber: values.sanctionNumber || '-',
    installedCapacity: values.installedCapacity || '-',
    capacity: values.capacity || '-',
    moduleType: values.moduleType || '-',
    moduleMake: values.moduleMake || '-',
    moduleWattage: values.moduleWattage || '-',
    moduleCount: values.moduleCount || '-',
    moduleEfficiency: values.moduleEfficiency || '-',
    moduleTotalCapacity: values.moduleTotalCapacity || '-',
    inverterDetails: values.inverterDetails || '-',
    inverterRating: values.inverterRating || '-',
    controllerType: values.controllerType || '-',
    inverterCapacity: values.inverterCapacity || '-',
    yearOfManufacture: values.yearOfManufacture || '-',
    earthingDetails: values.earthingDetails || '-',
    lighteningArrester: values.lighteningArrester || '-',
    signatoryName: values.signatoryName || '-',
    signatoryDesignation: values.signatoryDesignation || '-',
    warrantyText: values.warrantyText || '-',
    identityName: values.identityName || '-',
    identityAddress: values.identityAddress || '-',
    identityAadhar: values.identityAadhar || '-',
  };
}

function getFolderIcon(folder) {
  return folder.status === 'ready' ? <FileWordOutlined /> : <FileOutlined />;
}

function FolderPicker({ folders, selectedFolder, onSelect }) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
        marginBottom: 28,
      }}
      bodyStyle={{ padding: 18 }}
    >
      <Space wrap size={12}>
        {folders.map((folder) => {
          const isActive = folder.key === selectedFolder;
          return (
            <Button
              key={folder.key}
              onClick={() => onSelect(folder.key)}
              type={isActive ? 'primary' : 'default'}
              icon={getFolderIcon(folder)}
              style={{
                height: 44,
                borderRadius: 12,
                paddingInline: 16,
                boxShadow: isActive ? '0 10px 24px rgba(217, 119, 6, 0.18)' : 'none',
              }}
            >
              {folder.name}
            </Button>
          );
        })}
      </Space>
    </Card>
  );
}

function TemplatePreview({ values }) {
  const preview = useTemplatePreview(values);

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 16,
    padding: '6px 0',
    borderBottom: '1px dotted #ddd',
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 18,
        padding: 28,
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
        minHeight: 900,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#64748b', letterSpacing: 0.4 }}>Renewable Energy Generating System</div>
        <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
          Annexure-I
        </Title>
        <Text strong>(Commissioning Report for RE System)</Text>
      </div>

      <div style={{ marginTop: 18 }}>
        {[
          ['1. Name of the', preview.beneficiaryName],
          ['2. Consumer Number', preview.consumerNumber],
          ['3. Mobile Number', preview.mobileNumber],
          ['4. E-mail', preview.email],
          ['5. Address of Installation', preview.addressLines.join(', ') || '-'],
          ['6. RE Arrangement Type', preview.reArrangementType],
          ['7. RE Source', preview.reSource],
          ['8. Sanctioned Capacity (KW)', preview.sanctionedCapacityKw],
          ['9. Capacity Type', preview.capacityType],
          ['10. Project Model', preview.projectModel],
          ['11. RE installed Capacity (Rooftop)(KW)', preview.rooftopInstalledCapacityKw],
          ['12. RE installed Capacity (Rooftop + Ground) (KW)', preview.rooftopGroundInstalledCapacityKw],
          ['13. RE installed Capacity (Ground)(KW)', preview.groundInstalledCapacityKw],
          ['14. Installation date', preview.installationDate],
          ['15. Solar PV Detail', ''],
          ['Inverter Capacity (KW)', preview.inverterCapacityKw],
          ['Inverter Make', preview.inverterMake],
          ['No. of PV Modules', preview.pvModules],
          ['Module Capacity (KW)', preview.moduleCapacityKw],
        ].map(([label, value]) => (
          <div key={label} style={rowStyle}>
            <div style={{ fontWeight: 600, color: '#111827' }}>{label}</div>
            <div style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ textAlign: 'center', marginBottom: 16, fontWeight: 700 }}>Proforma-A</div>
        <Title level={4} style={{ textAlign: 'center', marginTop: 0 }}>
          COMMISSIONING REPORT (PROVISIONAL) FOR GRID CONNECTED SOLAR
        </Title>
        <div style={{ textAlign: 'center', marginTop: -8, marginBottom: 18, fontWeight: 500 }}>
          PHOTOVOLTAIC POWER PLANT (with Net-metering facility)
        </div>

        <p style={{ lineHeight: 1.85, marginBottom: 16 }}>
          Certified that a Grid Connected SPV Power Plant of <strong>{preview.sanctionedCapacityKw}</strong> capacity
          has been installed at site <strong>{preview.siteAddressSentence}</strong> which has been installed{' '}
          <strong>{preview.agencyName}</strong> on <strong>{preview.inspectionDate}</strong>. The system is as per
          BIS/MNRE Specifications. The system has been checked for its performance and found in order for further
          commissioning.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
          <div>
            <div style={{ minHeight: 90, border: '1px dashed #ddd', borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>Signature of the beneficiary</div>
              <div style={{ marginTop: 40, color: '#64748b' }}>and date</div>
            </div>
          </div>
          <div>
            <div style={{ minHeight: 90, border: '1px dashed #ddd', borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>Signature of the agency</div>
              <div style={{ marginTop: 8, color: '#64748b' }}>with name, seal</div>
            </div>
          </div>
        </div>

        <p style={{ lineHeight: 1.85, marginTop: 20 }}>
          The above RTS installation has been inspected by me for Pre-Commissioning Testing of Roof Top Solar
          Connection on dt <strong>{preview.inspectionDate}</strong> as per guidelines issued by the office of The
          Chief Engineer vide letter no 21653 on dt. 18.08.2022 and found in order for commissioning.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 18 }}>
          <div style={{ fontWeight: 700 }}>Signature of the MSEDCL Officer</div>
          <div>Name: {preview.officerName}</div>
          <div>Designation: {preview.officerDesignation}</div>
          <div>Date and seal: {preview.officerSealDate}</div>
        </div>
      </div>
    </div>
  );
}


function AnnexureFolder({ project, onDownload }) {
  const [form] = Form.useForm();
  const [liveValues, setLiveValues] = useState(getInitialValues(project));
  const previewValues = useTemplatePreview(liveValues);

  const handleReset = () => {
    const defaults = getInitialValues(project);
    form.resetFields();
    form.setFieldsValue(defaults);
    setLiveValues(defaults);
  };

  return (
    <Row gutter={24} align="top">
      <Col xs={24} xl={10}>
        <Card bordered={false} style={{ borderRadius: 18, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: '1 1 250px' }}>
              <Title level={2} style={{ margin: '0 0 8px 0' }}>
                Annexure Document
              </Title>
              <Text type="secondary">Edit values on the left and watch the document preview update live.</Text>
            </div>
            <Space style={{ flex: '0 0 auto' }}>
              <Button htmlType="button" icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button type="primary" htmlType="button" icon={<DownloadOutlined />} onClick={() => form.submit()}>
                Download DOCX
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onDownload}
            initialValues={getInitialValues(project)}
            onValuesChange={(_, allValues) => setLiveValues({ ...getInitialValues(project), ...allValues })}
          >
            <Divider orientation="left">Beneficiary Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="beneficiaryName" label="Beneficiary Name" rules={[{ required: true }]}>
                  <Input placeholder="Enter beneficiary name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="consumerNumber" label="Consumer Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="mobileNumber" label="Mobile Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="email" label="Email">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Installation Address</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="installationAddressLine1" label="Address Line 1">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="installationAddressLine2" label="Address Line 2">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="installationAddressLine3" label="Address Line 3">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="addressPostalLine" label="Postal / PIN Line">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="siteAddressSentence" label="Site Sentence">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Template Values</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="reArrangementType" label="RE Arrangement Type">
                  <Select
                    options={[
                      { value: 'Net Metering Arrangement', label: 'Net Metering Arrangement' },
                      { value: 'Gross Metering Arrangement', label: 'Gross Metering Arrangement' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="reSource" label="RE Source">
                  <Select
                    options={[
                      { value: 'Solar Roof top', label: 'Solar Roof top' },
                      { value: 'Solar Ground Mounted', label: 'Solar Ground Mounted' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="sanctionedCapacityKw" label="Sanctioned Capacity (kW)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="capacityType" label="Capacity Type">
                  <Select options={[{ value: 'Rooftop', label: 'Rooftop' }, { value: 'Ground', label: 'Ground' }]} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="projectModel" label="Project Model">
                  <Select options={[{ value: 'Capex', label: 'Capex' }, { value: 'Opex', label: 'Opex' }]} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="rooftopInstalledCapacityKw" label="RE Installed Capacity (Rooftop)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="rooftopGroundInstalledCapacityKw" label="RE Installed Capacity (Rooftop + Ground)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="groundInstalledCapacityKw" label="RE Installed Capacity (Ground)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="installationDate" label="Installation Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="inspectionDate" label="Commissioning Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="inverterCapacityKw" label="Inverter Capacity (kW)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="inverterMake" label="Inverter Make">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="pvModules" label="No. of PV Modules">
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleCapacityKw" label="Module Capacity (kW)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.001} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="agencyName" label="Agency Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="officerName" label="MSEDCL Officer Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="officerDesignation" label="MSEDCL Officer Designation">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="officerSealDate" label="Officer Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={14}>
        <TemplatePreview values={previewValues} />
      </Col>
    </Row>
  );
}

function ModelAgreementPreview({ values }) {
  const preview = useModelAgreementPreview(values);
  const applicantAddressLines = String(preview.applicantAddress || '-')
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);

  const vendorAddressLines = String(preview.vendorRegisteredAddress || '-')
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sectionStyle = {
    fontSize: 14,
    lineHeight: 1.85,
    color: '#111827',
    marginBottom: 16,
    textAlign: 'justify',
  };

  const centeredBold = {
    textAlign: 'center',
    fontWeight: 700,
    lineHeight: 1.5,
    marginBottom: 10,
    color: '#111827',
  };

  const headingStyle = {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 10,
    color: '#111827',
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 18,
        padding: 28,
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
        minHeight: 900,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Model Agreement</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>Between</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
          Applicant and the registered/empanelled Vendor for installation of rooftop solar system in residential house
          of the Applicant under simplified procedure of Rooftop Solar Programme
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>Ph-II</div>
      </div>

      <p style={sectionStyle}>
        This agreement is executed on <strong>{preview.agreementDate}</strong> for design, installation, commissioning
        and <strong>{preview.maintenancePeriodYears}</strong> comprehensive maintenance of rooftop solar system to be
        installed under simplified procedure of Rooftop Solar Programme Ph-II.
      </p>

      <div style={{ ...centeredBold, marginTop: 18 }}>Between</div>
      <p style={sectionStyle}>
        <strong>{preview.consumerName}</strong> (Name of Applicant) having residential Electricity Connection with
        Consumer number <strong>{preview.consumerNumber}</strong> From <strong>{preview.discomName}</strong> (DISCOM
        Address{' '}
        {applicantAddressLines.length ? (
          <>
            {applicantAddressLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                <strong>{line}</strong>
                {index < applicantAddressLines.length - 1 ? ' ' : ''}
              </span>
            ))}
          </>
        ) : (
          <strong>-</strong>
        )}
        ) (here in after referred as Applicant).
      </p>

      <div style={{ ...centeredBold, marginTop: 18 }}>And</div>
      <p style={sectionStyle}>
        <strong>{preview.vendorCompanyName}</strong> is registered/ empanelled with the (here in after referred as
        DISCOM) and is having registered/functional office at{' '}
        {vendorAddressLines.length ? (
          <>
            {vendorAddressLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                <strong>{line}</strong>
                {index < vendorAddressLines.length - 1 ? ' ' : ''}
              </span>
            ))}
          </>
        ) : (
          <strong>-</strong>
        )}
        . (Here in after referred as Vendor).
      </p>

      <p style={sectionStyle}>
        Both Applicant and the Vendor are jointly referred as <strong>Parties</strong>.
      </p>

      <p style={sectionStyle}>
        <strong>Whereas: -</strong> The Applicant intends to install rooftop solar system under simplified procedure of
        Rooftop Solar Programme Ph-II National Portal of the MNRE. The Vendor is registered/empanelled vendor with
        DISCOM for installation of rooftop solar under MNRE Schemes. The Vendor satisfies all the existing regulation
        pertaining to electrical safety and license in the respective state and it is not debarred or blacklisted from
        undertaking any such installations by any state/central Government agency. Both the parties are mutually
        agreed and understand their roles and responsibilities and have no liability to any other agency/firm/stake
        holder especially to DISCOM and MNRE.
      </p>

      <div style={headingStyle}>1.GENERAL TERMS: -</div>
      <p style={sectionStyle}>
        1.1 The Applicant hereby represents and warrants that the Applicant has the sole legal capacity to enter into
        this Agreement and authorize the construction, installation, and commissioning of the Rooftop Solar System (
        <strong>RTS System</strong>) which is inclusive of Balance of System (<strong>BoS</strong>) on the Applicant's
        premises (<strong>Applicant Site</strong>).
      </p>
      <p style={sectionStyle}>
        1.2 Vendor may propose changes to the scope, nature and or schedule of the services being performed under this
        Agreement.
      </p>
      <p style={sectionStyle}>
        1.3 The Applicant understands and agrees that future changes in load, electricity usage patterns and/or
        electricity tariffs may affect the economics of the RTS System.
      </p>

      <div style={headingStyle}>2. RTS System: -</div>
      <p style={sectionStyle}>
        2.1 Total capacity of RTS System will be minimum <strong>{preview.sanctionedCapacityKwp}</strong> kwp.
      </p>

      <p style={sectionStyle}>
        2.2 The Solar modules, inverters and BoS will confirm to minimum specifications and DCR requirement of MNRE.
      </p>
      <p style={sectionStyle}>
        2.3 Solar modules of <strong>{preview.moduleMake}</strong> make, <strong>{preview.moduleModel}</strong> model,
        <strong>{preview.moduleWattage}</strong> kWp capacity each and <strong>{preview.moduleEfficiency}</strong>{' '}
        efficiency will be procured and installed by the Vendor.
      </p>
      <p style={sectionStyle}>
        2.4 Solar inverter of <strong>{preview.inverterMake}</strong> make, <strong>{preview.inverterModel}</strong>{' '}
        model, <strong>{preview.inverterRatedCapacityKwp}</strong> kWp rated output Capacity will be procured and
        install by the Vendor.
      </p>

      <div style={headingStyle}>3. PRICE AND PAYMENT TERMS: -</div>
      <p style={sectionStyle}>
        3.1 The cost of RTS System will be Rs. <strong>{preview.totalProjectCost}</strong> (to be decided mutually).
      </p>
      <p style={sectionStyle}>
        Applicant shall pay the total cost to the Vendor as under: <strong>{preview.advancePaymentPercentage}</strong>{' '}
        as an advance on confirmation of the order; <strong>{preview.piPaymentPercentage}</strong> against Proforma
        Invoice (PI); <strong>{preview.installationPaymentPercentage}</strong> after installation and commissioning of
        the RTS System.
      </p>
      <p style={sectionStyle}>
        3.2 The order value and payment terms are fixed and will not be subject to any adjustment except approved in
        writing by Vendor.
      </p>

      <div style={headingStyle}>4. REPRESENTATIONS MADE BY THE APPLICANT: -</div>
      <p style={sectionStyle}>
        The Applicant acknowledge and agrees that the information disclosed by the Applicant to Vendor in connection
        with the supply of the System are true and accurate.
      </p>

      <div style={headingStyle}>5. MAINTENANCE: -</div>
      <p style={sectionStyle}>
        Vendor shall provide <strong>{preview.maintenancePeriodYears}</strong> free workmanship maintenance.
      </p>

      <div style={headingStyle}>10. CANCELLATION: -</div>
      <p style={sectionStyle}>
        If the Applicant cancels the order after the expiry of 7 (seven) days from the date of Order Form, the
        Applicant shall be liable to pay Vendor, a cancellation fee of{' '}
        <strong>{preview.cancellationFeePercentage}</strong> of the total order value plus costs and expenses incurred
        by Vendor.
      </p>

      <div style={headingStyle}>11. LIMITATION OF LIABILITY AND INDEMNITY: -</div>
      <p style={sectionStyle}>
        To the extent that terms implied by law apply to the RTS System and the services rendered under this
        Agreement, Vendor's liability for any breach of those terms is limited to repairing or replacing the RTS
        System or refund of the moneys paid by the Applicant to Vendor.
      </p>

      <div style={headingStyle}>15. GOVERNING LAW AND DISPUTE RESOLUTION: -</div>
      <p style={sectionStyle}>
        The interpretation and enforcement of this Agreement shall be governed by the laws of India and the dispute
        shall be settled by arbitration in accordance with the Arbitration and Conciliation Act, 1996.
      </p>

    </div>
  );
}

function NetMeteringPreview({ values }) {
  const preview = useNetMeteringPreview(values);

  const sectionStyle = {
    fontSize: 14,
    lineHeight: 1.85,
    color: '#111827',
    marginBottom: 14,
    textAlign: 'justify',
  };

  const centeredBold = {
    textAlign: 'center',
    fontWeight: 700,
    lineHeight: 1.5,
    marginBottom: 8,
    color: '#111827',
  };

  const headingStyle = {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 10,
    color: '#111827',
  };

  const signatureBoxStyle = {
    minHeight: 110,
    border: '1px dashed #d1d5db',
    borderRadius: 12,
    padding: 14,
    background: '#fafafa',
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 18,
        padding: 28,
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
        minHeight: 1100,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Net Metering Connection Agreement</div>
      </div>

      <p style={sectionStyle}>
        This agreement is made and entered into at{' '}
        <strong>
          {preview.agreementPlaceLine1} {preview.agreementPlaceLine2}
        </strong>{' '}
        on this day of <strong>{preview.agreementDate}</strong> between the Eligible Consumer{' '}
        <strong>{preview.consumerName}</strong> having premises at{' '}
        <strong>{preview.consumerAddressLines.join(' ') || '-'}</strong> Consumer No{' '}
        <strong>{preview.consumerNumber}</strong> As the First Party
      </p>

      <div style={{ ...centeredBold, marginTop: 12 }}>AND</div>

      <p style={sectionStyle}>
        The Distribution Licensee, <strong>{preview.licenseeName}</strong> and having its Registered Office at{' '}
        <strong>{preview.licenseeOffice}</strong> as second Party of this Agreement.
      </p>

      <p style={sectionStyle}>
        Whereas, the Eligible Consumer has applied to the Licensee for approval of a Net Metering Arrangement under
        the provisions of the Maharashtra Electricity Regulatory Commission (Net Metering for Roof-top Solar Photo
        Voltaic Systems) Regulations, 2015 ('the Net Metering Regulations') and sought its connectivity to the
        Licensee's Distribution Network.
      </p>

      <p style={sectionStyle}>
        And whereas, the Licensee has agreed to provide Network connectivity to the Eligible Consumer for injection of
        electricity generated from its Roof-top Solar PV System of <strong>{preview.sanctionedCapacityKw}kW</strong>.
      </p>

      <div style={{ ...centeredBold, marginTop: 16 }}>Both Parties hereby agree as follows: -</div>

      <div style={headingStyle}>Eligibility:</div>
      <p style={sectionStyle}>
        The Roof-top Solar PV System meets the applicable norms for being integrated into the Distribution Network,
        and that the Eligible Consumer shall maintain the System accordingly for the duration of this Agreement.
      </p>

      <div style={headingStyle}>Technical and Inter-connection Requirements:</div>
      <p style={sectionStyle}>
        The metering arrangement and the inter-connection of the Roof-top Solar PV System with the Network of the
        Licensee shall be as per the provisions of the Net Metering Regulations and the technical standards and norms
        specified by the Central Electricity Authority for connectivity of distributed generation resources and for
        the installation and operation of meters.
      </p>
      <p style={sectionStyle}>
        The Eligible Consumer agrees that he shall install, prior to connection of the Roof-top Solar PV System to the
        Network of the Licensee, an isolation device and the necessary protection equipment required for safe
        operation.
      </p>

      <div style={headingStyle}>Safety:</div>
      <p style={sectionStyle}>
        The equipment connected to the Licensee's Distribution System shall be compliant with International
        (IEEE/IEC) or Indian Standards (BIS), as the case may be, and the installation of electrical equipment shall
        comply with the requirements specified by the Electricity Authority regarding safety and electricity supply.
      </p>
      <p style={sectionStyle}>
        The design, installation, maintenance, and operation of the Roof-top Solar PV System shall be undertaken in a
        manner conducive to the safety of the Roof-top Solar PV as well as the Licensee's Network.
      </p>

      <div style={headingStyle}>Period of Agreement, and Termination:</div>
      <p style={sectionStyle}>
        This Agreement shall be for a period for 20 years, but may be terminated prematurely by mutual consent, by the
        Eligible Consumer by giving 30 days' notice, or by the Licensee by giving 30 days' notice if the Eligible
        Consumer breaches any terms of this Agreement or the provisions of the Net Metering Regulations.
      </p>

      <div style={headingStyle}>Access and Disconnection:</div>
      <p style={sectionStyle}>
        The Eligible Consumer shall provide access to the Licensee to the metering equipment and disconnecting devices
        of Roof-top Solar PV System. In an emergent or outage situation, the Licensee may disconnect power supply to
        the premises.
      </p>

      <div style={headingStyle}>Liabilities:</div>
      <p style={sectionStyle}>
        The Parties shall indemnify each other for damages or adverse effects of either Party's negligence or
        misconduct during the installation of the Roof-top Solar PV System, connectivity with the distribution
        Network and operation of the System.
      </p>

      <div style={headingStyle}>Commercial Settlement:</div>
      <p style={sectionStyle}>
        The commercial settlements under this Agreement shall be in accordance with the Net Metering Regulations.
        Existing metering shall be replaced by a bi-directional meter or a pair of meters as required by the
        Regulations.
      </p>

      <div style={headingStyle}>Connection Costs:</div>
      <p style={sectionStyle}>
        The Eligible Consumer shall bear all costs related to the setting up of the Roof-top Solar PV System,
        excluding the Net Metering Arrangement costs.
      </p>

      <div style={headingStyle}>Dispute Resolution:</div>
      <p style={sectionStyle}>
        Any dispute arising under this Agreement shall be resolved promptly, in good faith and in an equitable manner
        by both the Parties.
      </p>

      <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={signatureBoxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 18 }}>For Eligible Consumer</div>
          <div style={{ marginTop: 42, fontWeight: 700 }}>{preview.consumerName}</div>
        </div>
        <div style={signatureBoxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 18 }}>Witness (VENDOR)</div>
          <div style={{ marginTop: 42, fontWeight: 700 }}>{preview.vendorName}</div>
        </div>
      </div>
    </div>
  );
}

function UndertakingPreview({ values }) {
  const preview = useUndertakingPreview(values);

  const boxStyle = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 28,
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
    minHeight: 980,
  };

  const paragraphStyle = {
    fontSize: 14,
    lineHeight: 1.9,
    color: '#111827',
    marginBottom: 16,
    textAlign: 'justify',
  };

  return (
    <div style={boxStyle}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
          Undertaking/Self- Declaration for Domestic Content Requirement fulfilment
        </div>
      </div>

      <p style={paragraphStyle}>
        This is to certify that M/S <strong>{preview.companyName}</strong> has Installed{' '}
        <strong>{preview.installedCapacityKw}</strong> Grid Connected Rooftop Solar Plant. For at{' '}
        <strong>{preview.consumerName}</strong> at <strong>{preview.location}</strong> under application number{' '}
        <strong>{preview.applicationNumber}</strong> Dated <strong>{preview.agreementDate}</strong> under MSEDCL.
      </p>

      <p style={paragraphStyle}>
        It is hereby undertaken that the PV modules installed for the above-mentioned project are domestically
        manufactured using domestic manufactured solar cells. The details of installed PV Modules are follows:
      </p>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700 }}>PV Module Capacity</div>
          <div style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>{preview.moduleCapacityWp} WP</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700 }}>Number of PV Modules</div>
          <div style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>{preview.moduleCount}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700 }}>No of PV Module Serial Numbers</div>
          <div style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>
            {preview.moduleSerialNumbers}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700 }}>PV Module Make</div>
          <div style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>{preview.moduleMake}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700 }}>Cell manufacturer's name</div>
          <div style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>{preview.cellManufacturer}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700 }}>Cell GST invoice No</div>
          <div style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>
            {preview.cellGstInvoiceNo}
          </div>
        </div>
      </div>

      <p style={paragraphStyle}>
        The above undertaking is based on the certificate issued by PV Module manufacturer/supplier while supplying
        the above-mentioned order.
      </p>
      <p style={paragraphStyle}>
        I am <strong>{preview.signatoryName}</strong> on behalf of M/S <strong>{preview.companyName}</strong> further
        declare that the information given above is true and correct and nothing has been concealed therein. If
        anything is found incorrect at any stage, then REC/MNRE may take any appropriate action against my company
        for wrong declaration. Supporting documents and proof of the above information will be provided as and when
        requested by MNRE.
      </p>

      <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>(Signature With official Seal)</div>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>For M/S {preview.companyName}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <div style={{ marginBottom: 8 }}>Name: <strong>{preview.signatoryName}</strong></div>
            <div style={{ marginBottom: 8 }}>Designation: <strong>{preview.signatoryDesignation}</strong></div>
            <div style={{ marginBottom: 8 }}>Phone: <strong>{preview.phoneNumber}</strong></div>
            <div>Email: <strong>{preview.email}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkCompletionPreview({ values }) {
  const preview = useWorkCompletionPreview(values);

  const boxStyle = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 28,
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
    minHeight: 1100,
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.5fr',
    gap: 0,
    borderBottom: '1px solid #e5e7eb',
  };

  const cellStyle = {
    padding: '11px 12px',
    fontSize: 13,
    lineHeight: 1.6,
  };

  return (
    <div style={boxStyle}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
          Work Completion Report for Solar Power Plant
        </div>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ ...rowStyle, background: '#f8fafc', fontWeight: 700 }}>
          <div style={cellStyle}>Sr. No</div>
          <div style={cellStyle}>Component</div>
          <div style={cellStyle}>Observation</div>
        </div>
        {[
          ['1', 'Name', preview.consumerName],
          ['2', 'Consumer number', preview.consumerNumber],
          ['3', 'Site/Location with Complete Address', `${preview.siteAddressLine1} ${preview.siteAddressLine2} ${preview.siteAddressLine3} ${preview.siteAddressLine4}`],
          ['4', 'Category: Govt/Private Sector', preview.category],
          ['5', 'Sanction number', preview.sanctionNumber],
          ['6', 'Sanctioned Capacity of solar PV system (KW) Installed', preview.installedCapacity],
          ['', 'Capacity of solar PV system (KW)', preview.capacity],
          ['7', 'Specification of the Modules', ''],
          ['', 'Type of modules (Poly/Mono etc.)', preview.moduleType],
          ['', 'Make of manufacturing', preview.moduleMake],
          ['', 'Wattage per module', preview.moduleWattage],
          ['', 'No. of Module', preview.moduleCount],
          ['', 'Module Efficiency', preview.moduleEfficiency],
          ['', 'Total Capacity', preview.moduleTotalCapacity],
          ['8', 'PCU', ''],
          ['', 'Make & Model number of Inverter', preview.inverterDetails],
          ['', 'Rating', preview.inverterRating],
          ['', 'Type of charge controller/ MPPT', preview.controllerType],
          ['', 'Capacity of Inverter', preview.inverterCapacity],
          ['', 'Year of manufacturing', preview.yearOfManufacture],
          ['9', 'Earthing and Protections', ''],
          ['', 'No of Separate Earthing with earth Resistance', preview.earthingDetails],
          ['', 'Lightening Arrester', preview.lighteningArrester],
        ].map(([srNo, component, observation], index) => (
          <div
            key={`${component}-${index}`}
            style={{
              ...rowStyle,
              background: component === 'Specification of the Modules' || component === 'PCU' || component === 'Earthing and Protections' ? '#f9fafb' : '#fff',
            }}
          >
            <div style={{ ...cellStyle, fontWeight: 700 }}>{srNo}</div>
            <div style={{ ...cellStyle, fontWeight: component === 'Specification of the Modules' || component === 'PCU' || component === 'Earthing and Protections' ? 700 : 500 }}>
              {component}
            </div>
            <div style={{ ...cellStyle, fontWeight: 600 }}>{observation}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.9, marginTop: 20, textAlign: 'justify' }}>
        It is certified that the Earth Resistance measure in presence of Licensed Electrical Contractor/Supervisor and
        found in order i.e. &lt; 5 Ohms as per MNRE OM Dtd. 07.06.24 for CFA Component.
      </p>

      <p style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 18, textAlign: 'justify' }}>
        We <strong>{preview.companyName}</strong> &amp; <strong>{preview.consumerName}</strong> bearing Consumer Number{' '}
        <strong>{preview.consumerNumber}</strong> Ensured structural stability of installed solar power plant and
        obtained requisite permissions from the concerned authority. If in future, by virtue of any means due to
        collapsing or damage to installed solar power plant, MSEDCL will not be held responsible for any loss to
        property or human life, if any.
      </p>

      <p style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 18, textAlign: 'justify' }}>
        This is to Certified above Installed Solar PV System is working properly with electrical safety &amp;
        Islanding switch in case of any presence of backup inverter an arrangement should be made in such Way the
        backup inverter supply should never be synchronized with solar inverter to avoid any electrical accident due
        to back feeding. We will be held responsible for nonworking of islanding mechanism and back feed to the
        de-energized grid.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 24 }}>
        <div style={{ minHeight: 90, borderTop: '1px solid #d1d5db', paddingTop: 10, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>Signature [Vendor]</div>
        </div>
        <div style={{ minHeight: 90, borderTop: '1px solid #d1d5db', paddingTop: 10, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>Signature[Consumer]</div>
        </div>
      </div>

      <div style={{ marginTop: 18, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Guarantee Certificate Undertaking to be submitted by VENDOR</div>
        <p style={{ fontSize: 14, lineHeight: 1.9, textAlign: 'justify', marginBottom: 16 }}>
          The undersigned will provide the services to the consumers for repairs/maintenance of the RIS plant free of
          cost for 5 years of the comprehensive Maintenance Contract (CMC) period from the date of commissioning of the
          plant. Non performing/under-performing system component will be replaced Repaired free of cost in the CMC
          period.
        </p>

        <div style={{ minHeight: 80, borderTop: '1px solid #d1d5db', paddingTop: 10, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>Signature [Vendor]</div>
          <div>Stamp &amp; Seal</div>
        </div>

        <div style={{ marginTop: 18, fontSize: 14, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Identity Details of Consumer:</div>
          <div>{preview.identityName}</div>
          <div>Aadhar Number: {preview.identityAadhar || '-'}</div>
          <div>Address.</div>
          <div>{preview.identityAddress}</div>
        </div>
      </div>
    </div>
  );
}

function ModelAgreementFolder({ project, onDownload }) {
  const [form] = Form.useForm();
  const [liveValues, setLiveValues] = useState(getModelAgreementInitialValues(project));
  const previewValues = useModelAgreementPreview(liveValues);

  const handleReset = () => {
    const defaults = getModelAgreementInitialValues(project);
    form.resetFields();
    form.setFieldsValue(defaults);
    setLiveValues(defaults);
  };

  return (
    <Row gutter={24} align="top">
      <Col xs={24} xl={10}>
        <Card bordered={false} style={{ borderRadius: 18, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: '1 1 250px' }}>
              <Title level={2} style={{ margin: '0 0 8px 0' }}>
                Model Agreement
              </Title>
              <Text type="secondary">Edit values on the left and watch the document preview update live.</Text>
            </div>
            <Space style={{ flex: '0 0 auto' }}>
              <Button htmlType="button" icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button type="primary" htmlType="button" icon={<DownloadOutlined />} onClick={() => form.submit()}>
                Download DOCX
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onDownload}
            initialValues={getModelAgreementInitialValues(project)}
            onValuesChange={(_, allValues) => setLiveValues({ ...getModelAgreementInitialValues(project), ...allValues })}
          >
            <Divider orientation="left">Agreement Details</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="agreementDate" label="Agreement Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="discomName" label="DISCOM Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="consumerName" label="Consumer Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="consumerNumber" label="Consumer Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="sanctionedCapacityKwp" label="Sanctioned Capacity (kWp)">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="applicantAddress" label="Applicant Address">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Vendor Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="vendorCompanyName" label="Vendor Company Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="vendorRegisteredAddress" label="Vendor Registered Address">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">System Details</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleMake" label="Module Make">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleModel" label="Module Model">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="moduleWattage" label="Per Module Wattage">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="moduleEfficiency" label="Module Efficiency (%)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="inverterMake" label="Inverter Make">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="inverterModel" label="Inverter Model">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="inverterRatedCapacityKwp" label="Inverter Rated Capacity (kWp)">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Payment Terms</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="totalProjectCost" label="Total Project Cost (Rs.)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="advancePaymentPercentage" label="Advance Payment Percentage (%)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="piPaymentPercentage" label="PI Payment Percentage (%)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="installationPaymentPercentage" label="Installation Payment Percentage (%)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="maintenancePeriodYears" label="Maintenance Period">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="cancellationFeePercentage" label="Cancellation Fee Percentage (%)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="warrantyYears" label="Warranty Period">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={14}>
        <ModelAgreementPreview values={previewValues} />
      </Col>
    </Row>
  );
}

function NetMeteringFolder({ project, onDownload }) {
  const [form] = Form.useForm();
  const [liveValues, setLiveValues] = useState(getNetMeteringInitialValues(project));
  const previewValues = useNetMeteringPreview(liveValues);

  const handleReset = () => {
    const defaults = getNetMeteringInitialValues(project);
    form.resetFields();
    form.setFieldsValue(defaults);
    setLiveValues(defaults);
  };

  return (
    <Row gutter={24} align="top">
      <Col xs={24} xl={10}>
        <Card bordered={false} style={{ borderRadius: 18, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: '1 1 250px' }}>
              <Title level={2} style={{ margin: '0 0 8px 0' }}>
                Net Metering
              </Title>
              <Text type="secondary">Edit values on the left and watch the document preview update live.</Text>
            </div>
            <Space style={{ flex: '0 0 auto' }}>
              <Button htmlType="button" icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button type="primary" htmlType="button" icon={<DownloadOutlined />} onClick={() => form.submit()}>
                Download DOCX
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onDownload}
            initialValues={getNetMeteringInitialValues(project)}
            onValuesChange={(_, allValues) => setLiveValues({ ...getNetMeteringInitialValues(project), ...allValues })}
          >
            <Divider orientation="left">Agreement Details</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="agreementDate" label="Agreement Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="sanctionedCapacityKw" label="Sanctioned Capacity (kW)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="agreementPlaceLine1" label="Agreement Place Line 1">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="agreementPlaceLine2" label="Agreement Place Line 2">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Consumer Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="consumerName" label="Consumer Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="consumerAddressLine1" label="Consumer Address Line 1">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="consumerAddressLine2" label="Consumer Address Line 2">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="consumerAddressLine3" label="Consumer Address Line 3">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="consumerNumber" label="Consumer Number">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Licensee Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="licenseeName" label="Licensee Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="licenseeOffice" label="Registered Office">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="vendorName" label="Witness / Vendor Name">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={14}>
        <NetMeteringPreview values={previewValues} />
      </Col>
    </Row>
  );
}

function UndertakingFolder({ project, onDownload }) {
  const [form] = Form.useForm();
  const [liveValues, setLiveValues] = useState(getUndertakingInitialValues(project));
  const previewValues = useUndertakingPreview(liveValues);

  const handleReset = () => {
    const defaults = getUndertakingInitialValues(project);
    form.resetFields();
    form.setFieldsValue(defaults);
    setLiveValues(defaults);
  };

  return (
    <Row gutter={24} align="top">
      <Col xs={24} xl={10}>
        <Card bordered={false} style={{ borderRadius: 18, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: '1 1 250px' }}>
              <Title level={2} style={{ margin: '0 0 8px 0' }}>
                Undertaking
              </Title>
              <Text type="secondary">Edit values on the left and watch the document preview update live.</Text>
            </div>
            <Space style={{ flex: '0 0 auto' }}>
              <Button htmlType="button" icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button type="primary" htmlType="button" icon={<DownloadOutlined />} onClick={() => form.submit()}>
                Download DOCX
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onDownload}
            initialValues={getUndertakingInitialValues(project)}
            onValuesChange={(_, allValues) => setLiveValues({ ...getUndertakingInitialValues(project), ...allValues })}
          >
            <Divider orientation="left">Certificate Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="companyName" label="Company Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="installedCapacityKw" label="Installed Capacity">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="consumerName" label="Consumer Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="location" label="Location">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="applicationNumber" label="Application Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="agreementDate" label="Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">PV Module Details</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleCapacityWp" label="PV Module Capacity (WP)">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleCount" label="Number of PV Modules">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="moduleSerialNumbers" label="PV Module Serial Numbers">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="moduleMake" label="PV Module Make">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="cellManufacturer" label="Cell Manufacturer">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="cellGstInvoiceNo" label="Cell GST Invoice No">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Signatory Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="signatoryName" label="Signatory Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="signatoryDesignation" label="Designation">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="phoneNumber" label="Phone">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="email" label="Email">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={14}>
        <UndertakingPreview values={previewValues} />
      </Col>
    </Row>
  );
}

function WorkCompletionFolder({ project, onDownload }) {
  const [form] = Form.useForm();
  const [liveValues, setLiveValues] = useState(getWorkCompletionInitialValues(project));
  const previewValues = useWorkCompletionPreview(liveValues);

  const handleReset = () => {
    const defaults = getWorkCompletionInitialValues(project);
    form.resetFields();
    form.setFieldsValue(defaults);
    setLiveValues(defaults);
  };

  return (
    <Row gutter={24} align="top">
      <Col xs={24} xl={10}>
        <Card bordered={false} style={{ borderRadius: 18, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: '1 1 250px' }}>
              <Title level={2} style={{ margin: '0 0 8px 0' }}>
                Work Completion
              </Title>
              <Text type="secondary">Edit values on the left and watch the document preview update live.</Text>
            </div>
            <Space style={{ flex: '0 0 auto' }}>
              <Button htmlType="button" icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
              <Button type="primary" htmlType="button" icon={<DownloadOutlined />} onClick={() => form.submit()}>
                Download DOCX
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onDownload}
            initialValues={getWorkCompletionInitialValues(project)}
            onValuesChange={(_, allValues) => setLiveValues({ ...getWorkCompletionInitialValues(project), ...allValues })}
          >
            <Divider orientation="left">General Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="consumerName" label="Consumer Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="consumerNumber" label="Consumer Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="siteAddressLine1" label="Site Address Line 1">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="siteAddressLine2" label="Site Address Line 2">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="siteAddressLine3" label="Site Address Line 3">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="siteAddressLine4" label="Site Address Line 4">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="category" label="Category">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="sanctionNumber" label="Sanction Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="installedCapacity" label="Installed Capacity">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="capacity" label="Capacity">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Module Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="moduleType" label="Type of Modules">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleMake" label="Module Make">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleWattage" label="Wattage per Module">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleCount" label="No. of Module">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleEfficiency" label="Module Efficiency">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="moduleTotalCapacity" label="Total Capacity">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Inverter & Safety</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="inverterDetails" label="Make & Model number of Inverter">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="inverterRating" label="Rating">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="controllerType" label="Charge Controller / MPPT">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="inverterCapacity" label="Capacity of Inverter">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="yearOfManufacture" label="Year of Manufacture">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="earthingDetails" label="Earthing Details">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="lighteningArrester" label="Lightening Arrester">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Certificate Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="warrantyText" label="Warranty / Guarantee Certificate Text">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="signatoryName" label="Signatory Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="signatoryDesignation" label="Designation">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="identityAadhar" label="Aadhar Number">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="identityName" label="Identity Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="identityAddress" label="Identity Address">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="companyName" label="Company Name">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={14}>
        <WorkCompletionPreview values={previewValues} />
      </Col>
    </Row>
  );
}

function PlaceholderFolder({ folder }) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 18,
        minHeight: 320,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Empty
        description={
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{folder.name}</div>
            <Text type="secondary">This folder will use the same editor and preview layout when its template is added.</Text>
          </div>
        }
      />
    </Card>
  );
}

export default function ProjectDocumentGenerator({ project }) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [api, contextHolder] = notification.useNotification();

  const activeFolder = useMemo(
    () => DOCUMENT_FOLDERS.find((folder) => folder.key === selectedFolder) || null,
    [selectedFolder]
  );

  const handleDownload = async (values) => {
    const isModelAgreement = selectedFolder === 'model-agreement';
    const isNetMetering = selectedFolder === 'net-metering';
    const isUndertaking = selectedFolder === 'undertaking';
    const isWorkCompletion = selectedFolder === 'work-completion';
    const payload = isModelAgreement
      ? {
          ...values,
          agreementDate: values.agreementDate ? values.agreementDate.toISOString() : null,
        }
      : isNetMetering
      ? {
          ...values,
          agreementDate: values.agreementDate ? values.agreementDate.toISOString() : null,
        }
      : isUndertaking
      ? {
          ...values,
          agreementDate: values.agreementDate ? values.agreementDate.toISOString() : null,
        }
      : isWorkCompletion
      ? {
          ...values,
          agreementDate: values.agreementDate ? values.agreementDate.toISOString() : null,
        }
      : {
          ...values,
          installationDate: values.installationDate ? values.installationDate.toISOString() : null,
          inspectionDate: values.inspectionDate ? values.inspectionDate.toISOString() : null,
          officerSealDate: values.officerSealDate ? values.officerSealDate.toISOString() : null,
        };

    const response = await request.download({
      entity: isModelAgreement
        ? 'solarproject/model-agreement/download'
        : isNetMetering
        ? 'solarproject/net-metering/download'
        : isUndertaking
        ? 'solarproject/undertaking/download'
        : isWorkCompletion
        ? 'solarproject/work-completion/download'
        : 'solarproject/annexure/download',
      jsonData: payload,
      fileName: isModelAgreement
        ? `${values.consumerName || 'Model_Agreement'}_Model_Agreement.docx`
        : isNetMetering
        ? `${values.consumerName || 'Net_Metering'}_Net_Metering.docx`
        : isUndertaking
        ? `${values.companyName || 'Undertaking'}_Undertaking.docx`
        : isWorkCompletion
        ? `${values.consumerName || 'Work_Completion'}_Work_Completion.docx`
        : `${values.beneficiaryName || 'Annexure'}_Annexure.docx`,
    });

    if (!response?.success) {
      api.error({ message: response?.message || 'Failed to download document' });
      return;
    }

    api.success({ message: 'Document downloaded successfully' });
  };

  return (
    <div style={{ padding: '12px 0 40px' }}>
      {contextHolder}
      
      <FolderPicker folders={DOCUMENT_FOLDERS} selectedFolder={selectedFolder} onSelect={setSelectedFolder} />

      {!activeFolder ? (
        <Card
          bordered={false}
          style={{
            borderRadius: 18,
            minHeight: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Title level={4} style={{ marginBottom: 8 }}>
              Select a document type
            </Title>
            <Text type="secondary">Choose one document type above to load its editor and live preview.</Text>
          </div>
        </Card>
      ) : activeFolder.key === 'annexure' ? (
        <AnnexureFolder project={project} onDownload={handleDownload} />
      ) : activeFolder.key === 'model-agreement' ? (
        <ModelAgreementFolder project={project} onDownload={handleDownload} />
      ) : activeFolder.key === 'net-metering' ? (
        <NetMeteringFolder project={project} onDownload={handleDownload} />
      ) : activeFolder.key === 'undertaking' ? (
        <UndertakingFolder project={project} onDownload={handleDownload} />
      ) : activeFolder.key === 'work-completion' ? (
        <WorkCompletionFolder project={project} onDownload={handleDownload} />
      ) : (
        <PlaceholderFolder folder={activeFolder} />
      )}
    </div>
  );
}
