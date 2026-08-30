class InfluencerController {
  async registerInfluencer(req, res) {
    const { name, email } = req.body;
    res
      .status(201)
      .json({ message: `Influencer ${name} registered with email ${email}` });
  }

  async getMyProfile(req, res) {
    res.json({ message: 'test getMyProfile' });
  }

  async generateCoupons(req, res) {
    res.json({ message: 'test generateCoupons' });
  }

  async recordSale(req, res) {
    res.json({ message: 'test recordSale' });
  }
}

module.exports = new InfluencerController();
