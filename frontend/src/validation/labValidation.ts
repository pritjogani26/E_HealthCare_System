import * as Yup from "yup";

export const labValidationSchema = Yup.object({
  lab_name: Yup.string()
    .strip()
    .required("Lab name is required")
    .min(3, "Lab name must be at least 3 characters"),

  license_number: Yup.string()
    .nullable(),

  phone_number: Yup.string()
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit phone number")
    .nullable(),

  address_line: Yup.string()
    .required("Address is required"),

  pincode: Yup.string()
    .matches(/^[0-9]{6}$/, "Enter valid 6 digit pincode")
    .required("Pincode is required"),

  city: Yup.string()
    .required("City is required"),

  state: Yup.string()
    .required("State is required"),

  operating_hours: Yup.string()
    .nullable()
});