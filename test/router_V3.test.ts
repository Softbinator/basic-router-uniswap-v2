import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractReceipt } from "ethers";
import { ethers } from "hardhat";

import {
  BogdanRouterV3,
  BogdanRouterV3__factory,
  Token,
  Token__factory,
  UniswapV2Factory,
  UniswapV2Factory__factory,
  UniswapV2LibraryMock,
  UniswapV2LibraryMock__factory,
  UniswapV2PairC,
  UniswapV2PairC__factory,
  WETH9,
  WETH9__factory,
} from "../typechain";

describe("Router V# tests", function () {
  let Router: BogdanRouterV3;
  let WETH: WETH9;
  let UniswapV2Factory: UniswapV2Factory;
  let Token1: Token;
  let Token2: Token;
  let Token3: Token;
  let Token4: Token;
  let UniswapV2LibraryContract: UniswapV2LibraryMock;
  let UniswapV2Pair: UniswapV2PairC;

  let RouterFactory: BogdanRouterV3__factory;
  let WETHFactory: WETH9__factory;
  let UniswapV2FactoryFactory: UniswapV2Factory__factory;
  let TokenFactory: Token__factory;
  let UniswapV2LibraryFactory: UniswapV2LibraryMock__factory;
  let UniswapV2PairFactory: UniswapV2PairC__factory;

  let user: SignerWithAddress;
  let bob: SignerWithAddress;

  let min_liquidity: number = 1000;

  before(async function () {
    [user, bob] = await ethers.getSigners();
    RouterFactory = (await ethers.getContractFactory("BogdanRouterV3", user)) as BogdanRouterV3__factory;
    WETHFactory = (await ethers.getContractFactory("WETH9", user)) as WETH9__factory;
    UniswapV2FactoryFactory = (await ethers.getContractFactory("UniswapV2Factory", user)) as UniswapV2Factory__factory;
    TokenFactory = (await ethers.getContractFactory("Token", user)) as Token__factory;
    UniswapV2LibraryFactory = (await ethers.getContractFactory(
      "UniswapV2LibraryMock",
      user,
    )) as UniswapV2LibraryMock__factory;
  });

  beforeEach(async () => {
    WETH = await WETHFactory.deploy();
    Token1 = await TokenFactory.deploy("Token1", "T1");
    Token2 = await TokenFactory.deploy("Token2", "T2");
    Token3 = await TokenFactory.deploy("Token3", "T3");
    Token4 = await TokenFactory.deploy("Token4", "T4");
    UniswapV2Factory = await UniswapV2FactoryFactory.deploy(user.address);
    UniswapV2LibraryContract = await UniswapV2LibraryFactory.deploy();

    Router = await RouterFactory.deploy(UniswapV2Factory.address, WETH.address);
  });

  it("Corect deploy", async () => {
    expect(await Router.factory()).to.be.equal(UniswapV2Factory.address);
  });

  it("Add liquidity for first time static calculation", async () => {
    await Token1.mint(user.address, ethers.utils.parseEther("10"));
    await Token2.mint(user.address, ethers.utils.parseEther("10"));

    await Token1.approve(Router.address, ethers.utils.parseEther("100"));
    await Token2.approve(Router.address, ethers.utils.parseEther("100"));

    let amountADesired: BigNumber = ethers.utils.parseEther("2");
    let amountBDesired: BigNumber = ethers.utils.parseEther("2");
    let amountAMin: BigNumber = ethers.utils.parseEther("1");
    let amountBMin: BigNumber = ethers.utils.parseEther("1");

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs("1999999999999999000");
  });

  it("Add liquidity for second time static calculation", async () => {
    await addFirstLiquidityTest(Token1, Token2, user, Router);

    let amountADesired: BigNumber = ethers.utils.parseEther("2");
    let amountBDesired: BigNumber = ethers.utils.parseEther("2");
    let amountAMin: BigNumber = ethers.utils.parseEther("1");
    let amountBMin: BigNumber = ethers.utils.parseEther("1");

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(ethers.utils.parseEther("2"));
  });

  it("Add liquidity on existing pair but with less amount of tokenA static calculation", async () => {
    await addFirstLiquidityTest(Token1, Token2, user, Router);

    let amountADesired = ethers.utils.parseEther("2");
    let amountBDesired = ethers.utils.parseEther("2");
    let amountAMin = ethers.utils.parseEther("2");
    let amountBMin = ethers.utils.parseEther("1.1");

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(ethers.utils.parseEther("2"));
  });

  it("Add liquidity on existing pair but with less amount of tokenA", async () => {
    let _totalSupply = await addFirstLiquidityTest(Token1, Token2, user, Router);

    let amountADesired: BigNumber = ethers.utils.parseEther("2");
    let amountBDesired: BigNumber = ethers.utils.parseEther("2");
    let amountAMin: BigNumber = ethers.utils.parseEther("2");
    let amountBMin: BigNumber = ethers.utils.parseEther("1.1");

    let liquidity: BigNumber = await simulateAddLiquidity(
      Token1,
      Token2,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(liquidity);
  });

  it("Add liquidity for second time, with required B not in limits, but A is", async () => {
    let _totalSupply = await addFirstLiquidityTest(Token1, Token2, user, Router);

    let amountADesired = ethers.utils.parseEther("4");
    let amountBDesired = ethers.utils.parseEther("2");
    let amountAMin = ethers.utils.parseEther("2");
    let amountBMin = ethers.utils.parseEther("1.1");

    let liquidity: BigNumber = await simulateAddLiquidity(
      Token1,
      Token2,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(liquidity);
  });

  it("Add liquidity for second time, with required B not in limits and require A < min A", async () => {
    let _totalSupply = await addFirstLiquidityTest(Token1, Token2, user, Router);

    let amountADesired = ethers.utils.parseEther("4");
    let amountBDesired = ethers.utils.parseEther("1.9");
    let amountAMin = ethers.utils.parseEther("2");
    let amountBMin = ethers.utils.parseEther("1.1");

    await simulateAddLiquidity(
      Token1,
      Token2,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    ).to.be.revertedWith("expected amount A < amountAMin");
  });

  it("Add liquidity for second time, with required B not in limits and require A > min A, but > desired A", async () => {
    let _totalSupply = await addFirstLiquidityTest(Token1, Token2, user, Router);

    let amountADesired: BigNumber = ethers.utils.parseEther("4");
    let amountBDesired: BigNumber = ethers.utils.parseEther("5");
    let amountAMin: BigNumber = ethers.utils.parseEther("2");
    let amountBMin: BigNumber = ethers.utils.parseEther("4.1");
    await simulateAddLiquidity(
      Token1,
      Token2,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      _totalSupply,
    );
    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    ).to.be.revertedWith("expected amount A > amountADesired");
  });

  it("Add liquidity with eth first time", async () => {
    await addFirstLiquidityETHTest(Token1, user, Router);
  });

  it("Add liquidity eth for second time", async () => {
    let _totalSupply = await addFirstLiquidityETHTest(Token1, user, Router);

    let amountTokenDesired: BigNumber = ethers.utils.parseEther("4");
    let amountEth: BigNumber = ethers.utils.parseEther("2");
    let amountTokenMin: BigNumber = ethers.utils.parseEther("2");
    let amountEthMin: BigNumber = ethers.utils.parseEther("1.1");

    let liquidity: BigNumber = await simulateAddLiquidity(
      Token1,
      WETH,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountTokenDesired,
      amountEth,
      amountTokenMin,
      amountEthMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(liquidity);
  });

  it("Add liquidity eth but required token is not in limits and require eth > desired eth", async () => {
    // A - token
    let _totalSupply = await addFirstLiquidityETHTest(Token1, user, Router);

    let amountTokenDesired: BigNumber = ethers.utils.parseEther("4");
    let amountEth: BigNumber = ethers.utils.parseEther("1.9");
    let amountTokenMin: BigNumber = ethers.utils.parseEther("2");
    let amountEthMin: BigNumber = ethers.utils.parseEther("1.1");

    await simulateAddLiquidity(
      Token1,
      WETH,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountTokenDesired,
      amountEth,
      amountTokenMin,
      amountEthMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    ).to.be.revertedWith("expected amount A < amountAMin");
  });

  it("Add liquidity eth but required token is not in limits and require eth < min eth dynamic -", async () => {
    let _totalSupply = await addFirstLiquidityETHTest(Token1, user, Router);

    let amountTokenDesired: BigNumber = ethers.utils.parseEther("4");
    let amountEth: BigNumber = ethers.utils.parseEther("5");
    let amountTokenMin: BigNumber = ethers.utils.parseEther("2");
    let amountEthMin: BigNumber = ethers.utils.parseEther("4.1");

    await simulateAddLiquidity(
      Token1,
      WETH,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountTokenDesired,
      amountEth,
      amountTokenMin,
      amountEthMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    ).to.be.revertedWith("expected amount A > amountADesired");
  });

  it("Add liquidity eth but required token is not in limits but emount eth is", async () => {
    let _totalSupply = await addFirstLiquidityETHTest(Token1, user, Router);

    let amountTokenDesired: BigNumber = ethers.utils.parseEther("4");
    let amountEth: BigNumber = ethers.utils.parseEther("5");
    let amountTokenMin: BigNumber = ethers.utils.parseEther("2");
    let amountEthMin: BigNumber = ethers.utils.parseEther("1.1");

    let liquidity: BigNumber = await simulateAddLiquidity(
      Token1,
      WETH,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountTokenDesired,
      amountEth,
      amountTokenMin,
      amountEthMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(liquidity);
  });

  it("remove liq", async () => {
    // add liq
    await Token1.mint(user.address, ethers.utils.parseEther("10"));
    await Token2.mint(user.address, ethers.utils.parseEther("10"));

    await Token1.approve(Router.address, ethers.utils.parseEther("100"));
    await Token2.approve(Router.address, ethers.utils.parseEther("100"));

    let amountADesired: BigNumber = ethers.utils.parseEther("2");
    let amountBDesired: BigNumber = ethers.utils.parseEther("2");
    let amountAMin: BigNumber = ethers.utils.parseEther("1");
    let amountBMin: BigNumber = ethers.utils.parseEther("1");

    const tx = await UniswapV2Factory.createPair(Token1.address, Token2.address);
    const receipt: ContractReceipt = await tx.wait();
    const contractInfo: any = receipt.events?.filter(x => x.event == "PairCreated");
    UniswapV2Pair = (await ethers.getContractAt("UniswapV2PairC", contractInfo[0]["args"][2])) as UniswapV2PairC;

    UniswapV2Pair.approve(Router.address, ethers.utils.parseEther("100"));

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(sqrt(amountADesired.mul(amountBDesired)).sub(min_liquidity));

    let _totalSupply = sqrt(amountADesired.mul(amountBDesired));

    amountADesired = ethers.utils.parseEther("2");
    amountBDesired = ethers.utils.parseEther("2");
    amountAMin = ethers.utils.parseEther("2");
    amountBMin = ethers.utils.parseEther("1.1");

    let liquidity: BigNumber = await simulateAddLiquidity(
      Token1,
      Token2,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(liquidity);

    // remove it
    await expect(
      Router.removeLiquidity(
        Token1.address,
        Token2.address,
        // emitedLiq,
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("1"),
        user.address,
        1,
      ),
    ).to.emit(Router, "RemoveLiquidity");
  });

  it("remove liq with first min token amount to big", async () => {
    // add liq
    await Token1.mint(user.address, ethers.utils.parseEther("10"));
    await Token2.mint(user.address, ethers.utils.parseEther("10"));

    await Token1.approve(Router.address, ethers.utils.parseEther("100"));
    await Token2.approve(Router.address, ethers.utils.parseEther("100"));

    let amountADesired: BigNumber = ethers.utils.parseEther("2");
    let amountBDesired: BigNumber = ethers.utils.parseEther("2");
    let amountAMin: BigNumber = ethers.utils.parseEther("1");
    let amountBMin: BigNumber = ethers.utils.parseEther("1");

    const tx = await UniswapV2Factory.createPair(Token1.address, Token2.address);
    const receipt: ContractReceipt = await tx.wait();
    const contractInfo: any = receipt.events?.filter(x => x.event == "PairCreated");
    UniswapV2Pair = (await ethers.getContractAt("UniswapV2PairC", contractInfo[0]["args"][2])) as UniswapV2PairC;

    UniswapV2Pair.approve(Router.address, ethers.utils.parseEther("100"));

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(sqrt(amountADesired.mul(amountBDesired)).sub(min_liquidity));

    let _totalSupply = sqrt(amountADesired.mul(amountBDesired));

    amountADesired = ethers.utils.parseEther("2");
    amountBDesired = ethers.utils.parseEther("2");
    amountAMin = ethers.utils.parseEther("2");
    amountBMin = ethers.utils.parseEther("1.1");

    let liquidity: BigNumber = await simulateAddLiquidity(
      Token1,
      Token2,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      _totalSupply,
    );

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(liquidity);

    // remove it
    await expect(
      Router.removeLiquidity(
        Token1.address,
        Token2.address,
        // emitedLiq,
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("1"),
        user.address,
        1,
      ),
    ).to.be.revertedWith("Amount of first token is less than expected");
  });

  it("remove liq with second min token amount to big", async () => {
    // add liq
    await Token1.mint(user.address, ethers.utils.parseEther("10"));
    await Token2.mint(user.address, ethers.utils.parseEther("10"));

    await Token1.approve(Router.address, ethers.utils.parseEther("100"));
    await Token2.approve(Router.address, ethers.utils.parseEther("100"));

    let amountADesired: BigNumber = ethers.utils.parseEther("2");
    let amountBDesired: BigNumber = ethers.utils.parseEther("2");
    let amountAMin: BigNumber = ethers.utils.parseEther("1");
    let amountBMin: BigNumber = ethers.utils.parseEther("1");

    const tx = await UniswapV2Factory.createPair(Token1.address, Token2.address);
    const receipt: ContractReceipt = await tx.wait();
    const contractInfo: any = receipt.events?.filter(x => x.event == "PairCreated");
    UniswapV2Pair = (await ethers.getContractAt("UniswapV2PairC", contractInfo[0]["args"][2])) as UniswapV2PairC;

    UniswapV2Pair.approve(Router.address, ethers.utils.parseEther("100"));

    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(sqrt(amountADesired.mul(amountBDesired)).sub(min_liquidity));

    let _totalSupply = sqrt(amountADesired.mul(amountBDesired));

    amountADesired = ethers.utils.parseEther("2");
    amountBDesired = ethers.utils.parseEther("2");
    amountAMin = ethers.utils.parseEther("2");
    amountBMin = ethers.utils.parseEther("1.1");

    let liquidity: BigNumber = await simulateAddLiquidity(
      Token1,
      Token2,
      UniswapV2LibraryContract,
      UniswapV2Factory,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      _totalSupply,
    );
    await expect(
      Router.addLiquidity(
        Token1.address,
        Token2.address,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        user.address,
        1,
      ),
    )
      .to.emit(Router, "Liq")
      .withArgs(liquidity);

    // remove it
    await expect(
      Router.removeLiquidity(
        Token1.address,
        Token2.address,
        // emitedLiq,
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("10"),
        user.address,
        1,
      ),
    ).to.be.revertedWith("Amount of second token is less than expected");
  });

  //////////////////////////////////////////////////////////////////////////////////////////////

  it("remove liq eth", async () => {
    // add liq
    await Token1.mint(user.address, ethers.utils.parseEther("10"));

    await Token1.approve(Router.address, ethers.utils.parseEther("100"));

    let amountTokenDesired: BigNumber = ethers.utils.parseEther("2");
    let amountEth: BigNumber = ethers.utils.parseEther("2");
    let amountTokenMin: BigNumber = ethers.utils.parseEther("1");
    let amountEthMin: BigNumber = ethers.utils.parseEther("1");

    const tx = await UniswapV2Factory.createPair(Token1.address, WETH.address);
    const receipt: ContractReceipt = await tx.wait();
    const contractInfo: any = receipt.events?.filter(x => x.event == "PairCreated");
    UniswapV2Pair = (await ethers.getContractAt("UniswapV2PairC", contractInfo[0]["args"][2])) as UniswapV2PairC;

    UniswapV2Pair.approve(Router.address, ethers.utils.parseEther("100"));

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(sqrt(amountTokenDesired.mul(amountEth)).sub(min_liquidity));

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(sqrt(amountTokenDesired.mul(amountEth)));

    // remove it
    await expect(
      Router.removeLiquidityETH(
        Token1.address,
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("1"),
        user.address,
        1,
      ),
    ).to.emit(Router, "RemoveLiquidityETH");
  });

  it("remove liq eth, but resulted token amount is lower then minimum expected", async () => {
    // add liq
    await Token1.mint(user.address, ethers.utils.parseEther("10"));

    await Token1.approve(Router.address, ethers.utils.parseEther("100"));

    let amountTokenDesired: BigNumber = ethers.utils.parseEther("2");
    let amountEth: BigNumber = ethers.utils.parseEther("2");
    let amountTokenMin: BigNumber = ethers.utils.parseEther("1");
    let amountEthMin: BigNumber = ethers.utils.parseEther("1");

    const tx = await UniswapV2Factory.createPair(Token1.address, WETH.address);
    const receipt: ContractReceipt = await tx.wait();
    const contractInfo: any = receipt.events?.filter(x => x.event == "PairCreated");
    UniswapV2Pair = (await ethers.getContractAt("UniswapV2PairC", contractInfo[0]["args"][2])) as UniswapV2PairC;

    UniswapV2Pair.approve(Router.address, ethers.utils.parseEther("100"));

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(sqrt(amountTokenDesired.mul(amountEth)).sub(min_liquidity));

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(sqrt(amountTokenDesired.mul(amountEth)));

    // remove it
    await expect(
      Router.removeLiquidityETH(
        Token1.address,
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("1"),
        user.address,
        1,
      ),
    ).to.be.revertedWith("Amount of token is less than expected");
  });

  it("remove liq eth with resulted eth amount lower than minimum expected ", async () => {
    // add liq
    await Token1.mint(user.address, ethers.utils.parseEther("10"));

    await Token1.approve(Router.address, ethers.utils.parseEther("100"));

    let amountTokenDesired: BigNumber = ethers.utils.parseEther("2");
    let amountEth: BigNumber = ethers.utils.parseEther("2");
    let amountTokenMin: BigNumber = ethers.utils.parseEther("1");
    let amountEthMin: BigNumber = ethers.utils.parseEther("1");

    const tx = await UniswapV2Factory.createPair(Token1.address, WETH.address);
    const receipt: ContractReceipt = await tx.wait();
    const contractInfo: any = receipt.events?.filter(x => x.event == "PairCreated");
    UniswapV2Pair = (await ethers.getContractAt("UniswapV2PairC", contractInfo[0]["args"][2])) as UniswapV2PairC;

    UniswapV2Pair.approve(Router.address, ethers.utils.parseEther("100"));

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(sqrt(amountTokenDesired.mul(amountEth)).sub(min_liquidity));

    await expect(
      Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      }),
    )
      .to.emit(Router, "LiqETH")
      .withArgs(sqrt(amountTokenDesired.mul(amountEth)));

    // remove it
    await expect(
      Router.removeLiquidityETH(
        Token1.address,
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("10"),
        user.address,
        1,
      ),
    ).to.be.revertedWith("Eth amount is less than expected");
  });

  //////////////////////////////////////////////////////////////////////////////////
  // Swaps
  // test: exista nu exista perechi, amount out invalid, out of balance on amount in, pair has not amount out, 2 tokens, 3 tokens

  it("swapExactTokensForTokens", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
    );
    let amountIn = ethers.utils.parseEther("1");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactTokensForTokens(amountIn, amountOutMin, path, user.address, 1))
      .to.emit(Router, "SwapExactTokensForTokens")
      .withArgs(amountIn, amounts[amounts.length - 1]);
  });

  it("swapExactTokensForTokens invalid amount out", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
    );
    let amountIn = ethers.utils.parseEther("1");
    let amountOutMin = ethers.utils.parseEther("1");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactTokensForTokens(amountIn, amountOutMin, path, user.address, 1)).to.be.revertedWith(
      "Output amount is less than the minimum amount",
    );
  });

  it("swapExactTokensForTokens invalid amount in", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
    );
    let amountIn = ethers.utils.parseEther("70");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactTokensForTokens(amountIn, amountOutMin, path, user.address, 1)).to.be.revertedWith(
      "TransferHelper::transferFrom: transferFrom failed",
    );
  });

  it("swapExactTokensForTokens no liq on output pair", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      false,
      WETH,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    await expect(Router.swapExactTokensForTokens(amountIn, amountOutMin, path, user.address, 1)).to.be.revertedWith(
      "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
    );
  });

  it("swapExactTokensForTokens no liq on intermediate pair", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      false,
      true,
      WETH,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    await expect(Router.swapExactTokensForTokens(amountIn, amountOutMin, path, user.address, 1)).to.be.revertedWith(
      "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
    );
  });

  it("swapExactTokensForTokens no output pair", async () => {
    await createPairsAndAddLiquidity(
      2,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    await expect(Router.swapExactTokensForTokens(amountIn, amountOutMin, path, user.address, 1)).to.be.revertedWith(
      "No output pair",
    );
  });

  it("swapExactTokensForTokens with 2 pairs", async () => {
    await createPairsAndAddLiquidity(
      2,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactTokensForTokens(amountIn, amountOutMin, path, user.address, 1))
      .to.emit(Router, "SwapExactTokensForTokens")
      .withArgs(amountIn, amounts[amounts.length - 1]);
  });

  it("swapExactETHForTokens", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      true,
    );
    let amountIn = ethers.utils.parseEther("4");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [WETH.address, Token1.address, Token2.address, Token3.address, Token4.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactETHForTokens(amountOutMin, path, user.address, 1, { value: amountIn }))
      .to.emit(Router, "SwapExactETHForTokens")
      .withArgs(amountIn, amounts[amounts.length - 1]);
  });

  it("swapExactETHForTokens invalid amount out", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      true,
    );
    let amountIn = ethers.utils.parseEther("4");
    let amountOutMin = ethers.utils.parseEther("1");
    let path = [WETH.address, Token1.address, Token2.address, Token3.address, Token4.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);

    await expect(
      Router.swapExactETHForTokens(amountOutMin, path, user.address, 1, { value: amountIn }),
    ).to.be.revertedWith("Output amount is less than the minimum amount");
  });

  it("swapExactETHForTokens no liq on output pair", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      false,
      WETH,
      true,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [WETH.address, Token1.address, Token2.address, Token3.address, Token4.address];
    await expect(
      Router.swapExactETHForTokens(amountOutMin, path, user.address, 1, { value: amountIn }),
    ).to.be.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
  });

  it("swapExactETHForTokens 2 pairs", async () => {
    await createPairsAndAddLiquidity(
      1,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      true,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [WETH.address, Token1.address, Token2.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactETHForTokens(amountOutMin, path, user.address, 1, { value: amountIn }))
      .to.emit(Router, "SwapExactETHForTokens")
      .withArgs(amountIn, amounts[amounts.length - 1]);
  });

  it("swapTokensForExactTokens", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
    );
    let amountInMax = ethers.utils.parseEther("20");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsIn(UniswapV2Factory.address, amountOut, path);
    await expect(Router.swapTokensForExactTokens(amountOut, amountInMax, path, user.address, 1))
      .to.emit(Router, "SwapTokensForExactTokens")
      .withArgs(amounts[0], amountOut);
  });

  it("swapTokensForExactTokens with amount in max less then required", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
    );
    let amountInMax = ethers.utils.parseEther("0");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    // let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsIn(UniswapV2Factory.address, amountOut, path);
    await expect(Router.swapTokensForExactTokens(amountOut, amountInMax, path, user.address, 1)).to.be.revertedWith(
      "Input amount is greater than the maximum amount",
    );
  });

  it("swapTokensForExactTokens with 2 pairs", async () => {
    await createPairsAndAddLiquidity(
      2,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
    );
    let amountInMax = ethers.utils.parseEther("1");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [Token1.address, Token2.address, Token3.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsIn(UniswapV2Factory.address, amountOut, path);
    await expect(Router.swapTokensForExactTokens(amountOut, amountInMax, path, user.address, 1))
      .to.emit(Router, "SwapTokensForExactTokens")
      .withArgs(amounts[0], amountOut);
  });

  it("swapTokensForExactETH", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
      true,
    );
    let amountInMax = ethers.utils.parseEther("1");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [Token1.address, Token2.address, Token3.address, WETH.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsIn(UniswapV2Factory.address, amountOut, path);
    await expect(Router.swapTokensForExactETH(amountOut, amountInMax, path, user.address, 1))
      .to.emit(Router, "SwapTokensForExactETH")
      .withArgs(amounts[0], amountOut);
  });

  it("swapTokensForExactETH where last pair in path is not WETH", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
      true,
    );
    let amountInMax = ethers.utils.parseEther("1");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [Token1.address, Token2.address, Token3.address];
    await expect(Router.swapTokensForExactETH(amountOut, amountInMax, path, user.address, 1)).to.be.revertedWith(
      "Last address have to be WETH",
    );
  });

  it("swapTokensForExactETH where input amount is greater than input max", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
      true,
    );
    let amountInMax = ethers.utils.parseEther("0");
    let amountOut = ethers.utils.parseEther("1");
    let path = [Token1.address, Token2.address, Token3.address, WETH.address];
    await expect(Router.swapTokensForExactETH(amountOut, amountInMax, path, user.address, 1)).to.be.revertedWith(
      "To much amount required",
    );
  });

  it("swapTokensForExactETH no liq WETH", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
      true,
      true,
      false,
    );
    let amountInMax = ethers.utils.parseEther("1");
    let amountOut = ethers.utils.parseEther("1");
    let path = [Token1.address, Token2.address, Token3.address, WETH.address];
    await expect(Router.swapTokensForExactETH(amountOut, amountInMax, path, user.address, 1)).to.be.revertedWith(
      "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
    );
  });

  it("swapTokensForExactETH no liq first pair", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      false,
      true,
      true,
      WETH,
      false,
      true,
      true,
      true,
    );
    let amountInMax = ethers.utils.parseEther("1");
    let amountOut = ethers.utils.parseEther("1");
    let path = [Token1.address, Token2.address, Token3.address, WETH.address];
    await expect(Router.swapTokensForExactETH(amountOut, amountInMax, path, user.address, 1)).to.be.revertedWith(
      "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
    );
  });

  it("swapTokensForExactETH 2 pairs", async () => {
    await createPairsAndAddLiquidity(
      1,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      false,
      true,
      true,
      WETH,
      false,
      true,
      true,
      true,
    );
    let amountInMax = ethers.utils.parseEther("10");
    let amountOut = ethers.utils.parseEther("1");
    let path = [Token1.address, WETH.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsIn(UniswapV2Factory.address, amountOut, path);
    await expect(Router.swapTokensForExactETH(amountOut, amountInMax, path, user.address, 1))
      .to.emit(Router, "SwapTokensForExactETH")
      .withArgs(amounts[0], amountOut);
  });

  it("swapExactTokensForETH", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
      true,
      true,
      true,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address, WETH.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactTokensForETH(amountIn, amountOutMin, path, user.address, 1))
      .to.emit(Router, "SwapExactTokensForETH")
      .withArgs(amounts[0], amounts[amounts.length - 1]);
  });

  it("swapExactTokensForETH where last pair in path is not WETH", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
      true,
      true,
      true,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, Token2.address, Token3.address];
    await expect(Router.swapExactTokensForETH(amountIn, amountOutMin, path, user.address, 1)).to.be.revertedWith(
      "Last address have to be WETH",
    );
  });

  it("swapExactTokensForETH required output amount is less than min", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      false,
      true,
      true,
      true,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("10");
    let path = [Token1.address, Token2.address, Token3.address, WETH.address];
    await expect(Router.swapExactTokensForETH(amountIn, amountOutMin, path, user.address, 1)).to.be.revertedWith(
      "Output amount is less than min",
    );
  });

  it("swapExactTokensForETH 2 pairs", async () => {
    await createPairsAndAddLiquidity(
      1,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      false,
      true,
      true,
      WETH,
      false,
      true,
      true,
      true,
    );
    let amountIn = ethers.utils.parseEther("2");
    let amountOutMin = ethers.utils.parseEther("0");
    let path = [Token1.address, WETH.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsOut(UniswapV2Factory.address, amountIn, path);
    await expect(Router.swapExactTokensForETH(amountIn, amountOutMin, path, user.address, 1))
      .to.emit(Router, "SwapExactTokensForETH")
      .withArgs(amounts[0], amounts[amounts.length - 1]);
  });

  it("swapETHForExactTokens", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      true,
    );
    let amountInMax = ethers.utils.parseEther("2");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [WETH.address, Token1.address, Token2.address, Token3.address, Token4.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsIn(UniswapV2Factory.address, amountOut, path);
    await expect(Router.swapETHForExactTokens(amountOut, path, user.address, 1, { value: amountInMax }))
      .to.emit(Router, "SwapETHForExactTokens")
      .withArgs(amounts[0], amounts[amounts.length - 1]);
  });

  it("swapETHForExactTokens where first pair is not WETH", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      true,
    );
    let amountInMax = ethers.utils.parseEther("2");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [Token1.address, Token2.address, Token3.address, Token4.address];
    await expect(
      Router.swapETHForExactTokens(amountOut, path, user.address, 1, { value: amountInMax }),
    ).to.be.revertedWith("First address in path have to be WETH");
  });

  it("swapETHForExactTokens where first pair is not WETH", async () => {
    await createPairsAndAddLiquidity(
      3,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      true,
      true,
      true,
      WETH,
      true,
    );
    let amountInMax = ethers.utils.parseEther("0");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [WETH.address, Token1.address, Token2.address, Token3.address, Token4.address];
    await expect(
      Router.swapETHForExactTokens(amountOut, path, user.address, 1, { value: amountInMax }),
    ).to.be.revertedWith("Required input is less than msg.value");
  });

  it("swapETHForExactTokens 2 pairs", async () => {
    await createPairsAndAddLiquidity(
      1,
      Token1,
      Token2,
      Token3,
      Token4,
      user,
      UniswapV2Factory,
      Router,
      false,
      true,
      true,
      WETH,
      true,
    );
    let amountInMax = ethers.utils.parseEther("2");
    let amountOut = ethers.utils.parseEther("0.1");
    let path = [WETH.address, Token1.address];
    let amounts: BigNumber[] = await UniswapV2LibraryContract.getAmountsIn(UniswapV2Factory.address, amountOut, path);
    await expect(Router.swapETHForExactTokens(amountOut, path, user.address, 1, { value: amountInMax }))
      .to.emit(Router, "SwapETHForExactTokens")
      .withArgs(amounts[0], amounts[amounts.length - 1]);
  });
});

const ONE = ethers.BigNumber.from(1);

const TWO = ethers.BigNumber.from(2);

function sqrt(value: any) {
  let x = ethers.BigNumber.from(value);
  let z = x.add(ONE).div(TWO);
  let y = x;
  while (z.sub(y).isNegative()) {
    y = z;
    z = x.div(z).add(z).div(TWO);
  }
  return y;
}

async function createPairsAndAddLiquidity(
  nrOfPairs: number,
  Token1: Token,
  Token2: Token,
  Token3: Token,
  Token4: Token,
  user: SignerWithAddress,
  UniswapV2FactoryContract: UniswapV2Factory,
  Router: BogdanRouterV3,
  pair1: boolean,
  pair2: boolean,
  pair3: boolean,
  WETH: WETH9,
  hasEthAsInput: boolean = false,
  hasEthAsOutput: boolean = false,
  inputEthHasLiq: boolean = true,
  outputEthHasLiq: boolean = true,
) {
  await Token1.mint(user.address, ethers.utils.parseEther("20"));
  await Token2.mint(user.address, ethers.utils.parseEther("20"));
  await Token3.mint(user.address, ethers.utils.parseEther("20"));
  await Token4.mint(user.address, ethers.utils.parseEther("20"));
  await Token1.connect(user).approve(Router.address, ethers.utils.parseEther("100"));
  await Token2.connect(user).approve(Router.address, ethers.utils.parseEther("100"));
  await Token3.connect(user).approve(Router.address, ethers.utils.parseEther("100"));
  await Token4.connect(user).approve(Router.address, ethers.utils.parseEther("100"));

  let amountADesired: BigNumber = ethers.utils.parseEther("5");
  let amountBDesired: BigNumber = ethers.utils.parseEther("5");
  let amountAMin: BigNumber = ethers.utils.parseEther("1");
  let amountBMin: BigNumber = ethers.utils.parseEther("1");

  let amountTokenDesired: BigNumber = ethers.utils.parseEther("2");
  let amountEth: BigNumber = ethers.utils.parseEther("2");
  let amountTokenMin: BigNumber = ethers.utils.parseEther("1");
  let amountEthMin: BigNumber = ethers.utils.parseEther("1");

  if (hasEthAsInput) {
    await UniswapV2FactoryContract.createPair(WETH.address, Token1.address);
    await WETH.approve(Router.address, ethers.utils.parseEther("100"));
    if (inputEthHasLiq)
      await Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      });
  }
  if (hasEthAsOutput) {
    await UniswapV2FactoryContract.createPair(WETH.address, Token3.address);
    await WETH.approve(Router.address, ethers.utils.parseEther("100"));
    if (outputEthHasLiq)
      await Router.addLiquidityETH(Token3.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
        value: amountEth,
      });
    await UniswapV2FactoryContract.createPair(WETH.address, Token1.address);
    await WETH.approve(Router.address, ethers.utils.parseEther("100"));
    await Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
      value: amountEth,
    });
  }

  if (nrOfPairs != 0) {
    if (nrOfPairs >= 1) {
      await UniswapV2FactoryContract.createPair(Token1.address, Token2.address);

      if (pair1)
        await Router.addLiquidity(
          Token1.address,
          Token2.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          user.address,
          1,
        );
    }
    if (nrOfPairs >= 2) {
      await UniswapV2FactoryContract.createPair(Token2.address, Token3.address);
      if (pair2)
        await Router.addLiquidity(
          Token2.address,
          Token3.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          user.address,
          1,
        );
    }
    if (nrOfPairs >= 3) {
      await UniswapV2FactoryContract.createPair(Token3.address, Token4.address);
      if (pair3)
        await Router.addLiquidity(
          Token3.address,
          Token4.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          user.address,
          1,
        );
    }
  }
}

async function addFirstLiquidityTest(
  Token1: Token,
  Token2: Token,
  user: SignerWithAddress,
  Router: BogdanRouterV3,
): Promise<BigNumber> {
  let min_liquidity: BigNumber = BigNumber.from("1000");
  await Token1.mint(user.address, ethers.utils.parseEther("10"));
  await Token2.mint(user.address, ethers.utils.parseEther("10"));

  await Token1.approve(Router.address, ethers.utils.parseEther("100"));
  await Token2.approve(Router.address, ethers.utils.parseEther("100"));

  let amountADesired: BigNumber = ethers.utils.parseEther("2");
  let amountBDesired: BigNumber = ethers.utils.parseEther("2");
  let amountAMin: BigNumber = ethers.utils.parseEther("1");
  let amountBMin: BigNumber = ethers.utils.parseEther("1");

  await expect(
    Router.addLiquidity(
      Token1.address,
      Token2.address,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      user.address,
      1,
    ),
  )
    .to.emit(Router, "Liq")
    .withArgs(sqrt(amountADesired.mul(amountBDesired)).sub(min_liquidity));

  let _totalSupply = sqrt(amountADesired.mul(amountBDesired));
  return _totalSupply;
}
async function addFirstLiquidityETHTest(
  Token1: Token,
  user: SignerWithAddress,
  Router: BogdanRouterV3,
): Promise<BigNumber> {
  let min_liquidity: BigNumber = BigNumber.from("1000");
  await Token1.mint(user.address, ethers.utils.parseEther("10"));

  await Token1.approve(Router.address, ethers.utils.parseEther("100"));

  let amountTokenDesired: BigNumber = ethers.utils.parseEther("2");
  let amountEth: BigNumber = ethers.utils.parseEther("2");
  let amountTokenMin: BigNumber = ethers.utils.parseEther("1");
  let amountEthMin: BigNumber = ethers.utils.parseEther("1");

  await expect(
    Router.addLiquidityETH(Token1.address, amountTokenDesired, amountTokenMin, amountEthMin, user.address, 1, {
      value: amountEth,
    }),
  )
    .to.emit(Router, "LiqETH")
    .withArgs(sqrt(amountTokenDesired.mul(amountEth)).sub(min_liquidity));

  let _totalSupply = sqrt(amountTokenDesired.mul(amountEth));
  return _totalSupply;
}

async function simulateAddLiquidity(
  Token1: Token,
  Token2: Token | WETH9,
  UniswapV2LibraryContract: UniswapV2LibraryMock,
  UniswapV2Factory: UniswapV2Factory,
  amountADesired: BigNumber,
  amountBDesired: BigNumber,
  amountAMin: BigNumber,
  amountBMin: BigNumber,
  _totalSupply: BigNumber,
): Promise<BigNumber> {
  let reserveA;
  let reserveB;
  [reserveA, reserveB] = await UniswapV2LibraryContract.getReserves(
    UniswapV2Factory.address,
    Token1.address,
    Token2.address,
  );
  let requiredBAmount = await UniswapV2LibraryContract.quote(amountADesired, reserveA, reserveB);
  let emitedLiq = BigNumber.from("0");
  if (requiredBAmount <= amountBDesired && requiredBAmount > amountBMin) {
    emitedLiq =
      amountADesired.mul(_totalSupply).div(reserveA) < requiredBAmount.mul(_totalSupply).div(reserveB)
        ? amountADesired.mul(_totalSupply).div(reserveA)
        : requiredBAmount.mul(_totalSupply).div(reserveB);
  } else {
    let requiredAAmount = await UniswapV2LibraryContract.quote(amountBDesired, reserveB, reserveA);
    if (requiredAAmount <= amountADesired) {
      if (requiredAAmount >= amountAMin) {
        let condition: Boolean =
          requiredAAmount.mul(_totalSupply).div(reserveA) <= amountBDesired.mul(_totalSupply).div(reserveB);
        emitedLiq = condition
          ? requiredAAmount.mul(_totalSupply).div(reserveA)
          : amountBDesired.mul(_totalSupply).div(reserveB);
      }
    }
  }
  return emitedLiq;
}