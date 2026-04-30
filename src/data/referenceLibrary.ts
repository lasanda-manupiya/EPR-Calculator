import { ReferenceItem } from '@/types';

export const referenceLibrary: ReferenceItem[] = [
  { id: 'ref-1', referenceName: 'Cardboard primary box', materialType: 'Cardboard', packagingType: 'primary', length: 120, width: 90, height: 60, unit: 'mm', averageWeight: 45, densityValue: 0.000069, notes: 'General small retail carton' },
  { id: 'ref-2', referenceName: 'Cardboard secondary shipping box', materialType: 'Cardboard', packagingType: 'secondary', length: 250, width: 180, height: 120, unit: 'mm', averageWeight: 180, densityValue: 0.000033, notes: 'Typical shipping carton' },
  { id: 'ref-3', referenceName: 'Cardboard tertiary transit box', materialType: 'Cardboard', packagingType: 'tertiary', length: 450, width: 350, height: 300, unit: 'mm', averageWeight: 700, densityValue: 0.000015, notes: 'Bulk transport carton' },
  { id: 'ref-4', referenceName: 'Plastic mailer', materialType: 'Plastic', packagingType: 'secondary', length: 320, width: 240, height: 20, unit: 'mm', averageWeight: 22, densityValue: 0.000143, notes: 'Co-extruded courier mailer' },
  { id: 'ref-5', referenceName: 'Plastic wrap', materialType: 'Plastic', packagingType: 'primary', length: 300, width: 300, height: 40, unit: 'mm', averageWeight: 18, densityValue: 0.00005, notes: 'Protective wrap layer' },
  { id: 'ref-6', referenceName: 'Paper sleeve', materialType: 'Paper', packagingType: 'primary', length: 200, width: 120, height: 10, unit: 'mm', averageWeight: 12, densityValue: 0.0005, notes: 'Lightweight paper wrap' },
  { id: 'ref-7', referenceName: 'Glass bottle', materialType: 'Glass', packagingType: 'primary', length: 70, width: 70, height: 250, unit: 'mm', averageWeight: 320, densityValue: 0.000261, notes: 'Standard 750 ml bottle' },
  { id: 'ref-8', referenceName: 'Aluminium can', materialType: 'Aluminium', packagingType: 'primary', length: 66, width: 66, height: 122, unit: 'mm', averageWeight: 14, densityValue: 0.000213, notes: '330 ml beverage can' },
  { id: 'ref-9', referenceName: 'Steel tin', materialType: 'Steel', packagingType: 'primary', length: 85, width: 85, height: 120, unit: 'mm', averageWeight: 90, densityValue: 0.000104, notes: 'Food-grade steel tin' },
  { id: 'ref-10', referenceName: 'Wooden crate', materialType: 'Wood', packagingType: 'tertiary', length: 600, width: 400, height: 300, unit: 'mm', averageWeight: 3500, densityValue: 0.000049, notes: 'Reusable logistics crate' },
];
