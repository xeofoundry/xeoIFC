<!-- Generated file: edit the source in the dev repository. sha256:24d756c74fc721df -->
# xeoIFC metadata JSON format

With `-m <path>.json` the [command-line converter](README.md) writes all non-geometric information of the IFC model into one JSON
file: the object tree, property sets, element quantities, materials, groups and units. The file follows the xeokit metadata
conventions (`metaObjects` with `id`, `name`, `type`, `parent`), so it can be loaded by xeokit directly, and extends them with the
IFC data described here.

With `-m <path>.ifc` or `-m <path>.ifczip` the converter writes a metadata IFC instead: the input model without its geometry, see
[Metadata file types](README.md#metadata-file-types).

The glTF node names and the metadata `id` values are both the IFC GlobalId, which links geometry and metadata.

Examples on this page are taken from a conversion of the public `Duplex.ifc` sample.

## Root level

```json
{
  "id": "0001",
  "projectId": "1xS3BCk291UvhgP2a6eflL",
  "schema": "IFC2X3",
  "createdAt": "2011-09-07T12:28:29",
  "creatingApplication": "20100326_1700",
  "fileHeader": { "fileDescription": {}, "fileName": {}, "fileSchema": [ "IFC2X3" ] },
  "metaObjects": [],
  "propertySets": [],
  "properties": [],
  "materials": [],
  "groups": [],
  "units": [],
  "projectUnits": {}
}
```

`fileHeader` repeats the STEP header of the IFC file (`FILE_DESCRIPTION`, `FILE_NAME`, `FILE_SCHEMA`).

## Objects

Every spatial structure element and every building element is one entry in `metaObjects`:

```json
{
  "id": "2O2Fr$t4X7Zf8NOew3FNtn",
  "name": "Basic Wall:Exterior - Brick on Block:138062",
  "type": "IfcWallStandardCase",
  "parent": "1xS3BCk291UvhgP2dvNMKI",
  "materials": [ 74 ],
  "ObjectType": "Basic Wall:Exterior - Brick on Block:130892",
  "tag": "138062",
  "propertySetIds": [ "0JF3EUXy12MP97mAZ8h71t", "0VjO5hhgL0$f$XR668oalk" ]
}
```

- `parent` is the `id` of the parent object; it is `null` for the `IfcProject`.
- `propertySetIds` refer to the `id` of entries in the root-level `propertySets` array.
- `materials` are indices into the root-level `materials` array.
- Members without a value in the IFC file (`tag`, `ObjectType`, `longName`, `PredefinedType`, ...) are left out.
- Group and zone memberships (`IfcRelAssignsToGroup`) are listed in the root-level `groups` array and per object.

An `IfcBuildingStorey` carries its elevation:

```json
{
  "id": "1xS3BCk291UvhgP2dvNMKI",
  "name": "Level 1",
  "type": "IfcBuildingStorey",
  "parent": "1xS3BCk291UvhgP2a6eflK",
  "attributes": { "elevation": 0.0 }
}
```

`elevation` is the value written by the authoring tool of the IFC file, scaled to metres. The converter does not compute it.

## Property sets

IFC elements can have any number of `IfcPropertySet` objects attached. Each entry of `propertySets` lists its properties as
indices into the root-level `properties` array. Identical properties are stored once and shared between property sets.

```json
"propertySets": [
  {
    "id": "0TnLbAMunB8BqfZMTM2K4n",
    "name": "GSA Space Areas",
    "type": "IfcElementQuantity",
    "properties": [ 0 ]
  }
]
```

A property from this IFC line

```text
#37926=IFCPROPERTYSINGLEVALUE('Base Offset',$,IFCLENGTHMEASURE(2.612),$);
```

is exported as

```json
{
  "name": "Base Offset",
  "ifcPropertyType": "IfcPropertySingleValue",
  "ifcValueType": "IfcLengthMeasure",
  "value": 2.612,
  "valueType": "number"
}
```

| Member | Meaning |
|---|---|
| `name`, `description` | From the IFC property; left out when empty. |
| `ifcPropertyType` | IFC class of the property. Switch off with `exportIfcPropertyTypes`, see [configuration.md](configuration.md). |
| `ifcValueType` | IFC type of the value. Switch off with `exportIfcValueTypes`. |
| `value` | The value, as JSON number or string. |
| `valueType` | Elementary type of `value`, derived from the IFC type definition (`TYPE IfcLengthMeasure = REAL;` gives `"number"`). One of `"number"`, `"string"`, `"boolean"`, `"logical"`, `"enumeration"`, `"array"`. |
| `unit` | Index into the root-level `units` array. Only present when the property has its own unit; otherwise the project unit applies. |
| `properties` | Only for nested properties, see below. |

Properties can be nested (`IfcComplexProperty`, `IfcPhysicalComplexQuantity`). Such an entry has the `valueType`
`"ComplexProperty"` or `"ComplexElementQuantity"`, no `value`, and a `properties` array with the indices of its children.

## Element quantities

Element quantities (`IfcElementQuantity`) describe physical characteristics such as lengths, areas and volumes, typically used for
quantity take-off and cost estimation. They are exported the same way as property sets, with `"type": "IfcElementQuantity"`.

```text
#68=IFCQUANTITYAREA('GSA BIM Area',$,$,30.14164524999992);
#69=IFCELEMENTQUANTITY('0TnLbAMunB8BqfZMTM2K4n',#33,'GSA Space Areas',$,'GSA BIM Area',(#68));
```

```json
{
  "name": "GSA BIM Area",
  "ifcPropertyType": "IfcQuantityArea",
  "ifcValueType": "IfcQuantityArea",
  "value": 30.1416452499,
  "valueType": "number"
}
```

## Units

All units used by the project, by property values and by quantities are collected in the root-level `units` array. They keep the
object structure of IFC, so no information is lost. STEP entity ids (`#15`) are local to one file and are therefore replaced by
0-based indices into the `units` array.

`projectUnits` names the default unit per unit type, as assigned to the `IfcProject`:

```json
"projectUnits": {
  "LENGTHUNIT": 0,
  "AREAUNIT": 1,
  "VOLUMEUNIT": 2,
  "PLANEANGLEUNIT": 3,
  "TIMEUNIT": 5
}
```

A property or quantity without a `unit` member uses the project unit of its kind. Project units do **not** apply to the glTF
geometry, which is always in metres.

### SI units

```text
#15= IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);
```

```json
{ "name": "m", "className": "IfcSIUnit", "unitEnum": "LENGTHUNIT" }
```

A prefix such as `.MILLI.` is exported as `"prefix"`.

### Conversion based units

Units such as inch or degree are defined by a factor relative to an SI unit:

```text
#86= IFCCONVERSIONBASEDUNIT(#87,.PLANEANGLEUNIT.,'DEGREE',#88);
#87= IFCDIMENSIONALEXPONENTS(0,0,0,0,0,0,0);
#88= IFCMEASUREWITHUNIT(IFCREAL(0.017453292519943),#18);
#18= IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);
```

```json
{
  "name": "DEGREE",
  "className": "IfcConversionBasedUnit",
  "unitEnum": "PLANEANGLEUNIT",
  "conversionFactor": {
    "valueComponent": { "value": 0.0174532925, "valueType": "number" },
    "unitComponent": 4
  },
  "dimensions": {
    "AmountOfSubstanceExponent": 0,
    "ElectricCurrentExponent": 0,
    "LengthExponent": 0,
    "LuminousIntensityExponent": 0,
    "MassExponent": 0,
    "ThermodynamicTemperatureExponent": 0,
    "TimeExponent": 0
  }
}
```

`unitComponent` is the index of the SI unit (`#18`, radian) in the `units` array.

### Derived units

```text
#15= IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);
#20= IFCSIUNIT(*,.TIMEUNIT.,$,.SECOND.);
#91= IFCDERIVEDUNITELEMENT(#15,1);
#97= IFCDERIVEDUNITELEMENT(#20,-1);
#98= IFCDERIVEDUNIT((#91,#97),.LINEARVELOCITYUNIT.,$,'m/s');
```

```json
{
  "name": "m/s",
  "className": "IfcDerivedUnit",
  "unitType": "LINEARVELOCITYUNIT",
  "elements": [
    { "unit": 0, "exponent": 1 },
    { "unit": 5, "exponent": -1 }
  ]
}
```

Each element refers to a unit in the `units` array by index. A user defined derived unit carries its name in `userDefinedType`.
Monetary units are exported with the `className` `IfcMonetaryUnit`.

## Evaluation mode

Without a license key, ` - evaluation version` is appended to the `name` of the `IfcProject` object. See
[README.md](README.md#license-key).

---

Powered by xeoFoundry - [www.xeofoundry.com](https://xeofoundry.com)
