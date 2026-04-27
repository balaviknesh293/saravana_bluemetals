const asyncHandler = require("../utils/asyncHandler");
const {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer
} = require("../services/erpService");

const listCustomers = asyncHandler(async (_req, res) => {
  const customers = await getCustomers();
  res.status(200).json({ success: true, customers });
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await addCustomer(req.body);
  res.status(201).json({ success: true, message: "Customer created.", customer });
});

const editCustomer = asyncHandler(async (req, res) => {
  const customer = await updateCustomer(req.params.customerId, req.body);
  res.status(200).json({ success: true, message: "Customer updated.", customer });
});

const removeCustomer = asyncHandler(async (req, res) => {
  await deleteCustomer(req.params.customerId);
  res.status(200).json({ success: true, message: "Customer deleted." });
});

module.exports = { listCustomers, createCustomer, editCustomer, removeCustomer };