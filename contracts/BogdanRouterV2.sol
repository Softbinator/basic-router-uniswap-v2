// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@uniswap/v2-periphery/contracts/libraries/SafeMath.sol";

import "hardhat/console.sol";

contract BogdanRouterV2 is IUniswapV2Router02 {
    address public override factory;
    address public override WETH;

    event Liq(uint256);
    event LiqETH(uint256);
    event Liquidity(uint256);
    event RemoveLiquidity(address, uint256, uint256);
    event RemoveLiquidityETH(address, uint256, uint256);
    event SwapExactToTokens(address, address);
    event SwapTokensToExact(address, address);
    event SwapExactTokensForTokens(uint256 amountIn, uint256 amountOut);
    event SwapTokensForExactTokens(uint256 amountIn, uint256 amountOut);
    event SwapTokensForExactETH(uint256 amountIn, uint256 amountOut);
    event SwapExactTokensForETH(uint256 amountIn, uint256 amountOut);
    event SwapETHForExactTokens(uint256 amountIn, uint256 amountOut);

    constructor(address _factory, address _WETH) public {
        factory = _factory;
        WETH = _WETH;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        virtual
        override
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        // check for pair
        // create if not
        // check if the equivalent of first token is in params, if not check otherwise
        // transfer to pair the funds
        // mint and get liqudity

        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = IUniswapV2Factory(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = UniswapV2Library.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountADesired);
            TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountBDesired);
        } else {
            amountB = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
            if (amountB < amountBMin || amountB > amountBDesired) {
                amountA = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
                require(amountA >= amountAMin, "Insuficient amount");
                require(amountA <= amountADesired, "Insuficient amount2");
                TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
                TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountBDesired);
            } else {
                TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountADesired);
                TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
            }
        }
        liquidity = IUniswapV2Pair(pair).mint(to);
        emit Liq(liquidity);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        payable
        virtual
        override
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        )
    {
        // check for pair or create it
        // get de quote
        // transfer to pair according with conditions
        // mint to get liquidity

        if (IUniswapV2Factory(factory).getPair(token, WETH) == address(0)) {
            IUniswapV2Factory(factory).createPair(token, WETH);
        }
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        (uint256 reserveToken, uint256 reserveEth) = UniswapV2Library.getReserves(factory, token, WETH);
        if (reserveToken == 0 && reserveEth == 0) {
            TransferHelper.safeTransferFrom(token, msg.sender, pair, amountTokenDesired);
            IWETH(WETH).deposit{ value: msg.value }();
            IWETH(WETH).transfer(pair, msg.value);
        } else {
            amountToken = UniswapV2Library.quote(msg.value, reserveEth, reserveToken);
            if (amountToken < amountTokenMin || amountToken > amountTokenDesired) {
                amountETH = UniswapV2Library.quote(amountTokenDesired, reserveToken, reserveEth);
                require(amountETH >= amountETHMin, "Insuficient eth");
                require(amountETH <= msg.value, "Insuficient eth2");
                TransferHelper.safeTransferFrom(token, msg.sender, pair, amountTokenDesired);
                IWETH(WETH).deposit{ value: amountETH }();
                IWETH(WETH).transfer(pair, amountETH);
                if (amountETH < msg.value) {
                    TransferHelper.safeTransferETH(msg.sender, amountETH - msg.value);
                }
            } else {
                TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
                IWETH(WETH).deposit{ value: msg.value }();
                IWETH(WETH).transfer(pair, msg.value);
            }
        }
        liquidity = IUniswapV2Pair(pair).mint(to);
        emit LiqETH(liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public virtual override returns (uint256 amountA, uint256 amountB) {
        // sort tokens
        // burn liquidity
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        uint256 totalLiq = IUniswapV2Pair(pair).balanceOf(msg.sender);
        IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity);
        // TransferHelper.safeTransferFrom(pair, msg.sender, pair, liquidity);
        (amountA, amountB) = IUniswapV2Pair(pair).burn(to);

        (address token1, ) = UniswapV2Library.sortTokens(tokenA, tokenB);
        (amountA, amountB) = token1 == tokenA ? (amountA, amountB) : (amountB, amountA);
        require(amountA >= amountAMin, "Insuficient amount");
        require(amountB >= amountBMin, "Insuficient amount2");
        emit RemoveLiquidity(to, amountA, amountB);
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) public virtual override returns (uint256 amountToken, uint256 amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity);
        (uint256 amount1, uint256 amount2) = IUniswapV2Pair(pair).burn(address(this)); // use address this, bcs we want to convert WETH in eth and send eth

        (address token1, ) = UniswapV2Library.sortTokens(token, WETH);
        (amountToken, amountETH) = token1 == token ? (amount1, amount2) : (amount2, amount1);
        require(amountToken >= amountTokenMin, "Insuficient amount");
        require(amountETH >= amountETHMin, "Insuficient amount2");

        // IUniswapV2Pair(pair).transfer(to, amountToken);
        TransferHelper.safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
        emit RemoveLiquidityETH(to, amountToken, amountETH);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {
        require(
            IUniswapV2Factory(factory).getPair(path[path.length - 2], path[path.length - 1]) != address(0),
            "No output pair"
        );
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient amount");
        // transfer funds to first pair
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            UniswapV2Library.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        // iterate trought path and swap tokens
        for (uint256 i; i < path.length - 1; ++i) {
            (address input, address output) = UniswapV2Library.sortTokens(path[i], path[i + 1]);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == path[i]
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address pair = UniswapV2Library.pairFor(factory, path[i], path[i + 1]);
            address destination = i < path.length - 2
                ? UniswapV2Library.pairFor(factory, path[i + 1], path[i + 2])
                : to;
            IUniswapV2Pair(pair).swap(amount0Out, amount1Out, destination, new bytes(0));
        }
        emit SwapExactTokensForTokens(amountIn, amounts[amounts.length - 1]);
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable override returns (uint256[] memory amounts) {
        // get amounts
        // check last amount
        // transfer into the first pair/ deposit eth
        // swap in paths
        require(path[0] == WETH, "First address have to be WETH");
        amounts = UniswapV2Library.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient amount");

        IWETH(WETH).deposit{ value: msg.value }();
        // TransferHelper.safeTransferFrom(WETH, path[0], UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]);

        IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]);

        for (uint256 i; i < path.length - 1; ++i) {
            (address input, address output) = UniswapV2Library.sortTokens(path[i], path[i + 1]);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == path[i]
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address pair = UniswapV2Library.pairFor(factory, path[i], path[i + 1]);
            address destination = i < path.length - 2
                ? UniswapV2Library.pairFor(factory, path[i + 1], path[i + 2])
                : to;
            IUniswapV2Pair(pair).swap(amount0Out, amount1Out, destination, new bytes(0));
        }
        emit SwapExactTokensForTokens(msg.value, amounts[amounts.length - 1]);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {
        // get amounts
        // check amount 0
        // transfer first input token in pair
        // swap in paths
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "Insufficient amount");

        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            UniswapV2Library.pairFor(factory, path[0], path[1]),
            amounts[0]
        );

        for (uint256 i; i < path.length - 1; ++i) {
            (address input, address output) = UniswapV2Library.sortTokens(path[i], path[i + 1]);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == path[i]
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address pair = UniswapV2Library.pairFor(factory, path[i], path[i + 1]);
            address destination = i < path.length - 2
                ? UniswapV2Library.pairFor(factory, path[i + 1], path[i + 2])
                : to;
            IUniswapV2Pair(pair).swap(amount0Out, amount1Out, destination, new bytes(0));
        }

        emit SwapTokensForExactTokens(amounts[0], amountOut);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {
        // amounts
        // check amounts[0] and path[ultimul]
        // transfer into pair
        // swap
        // transfer eth
        require(path[path.length - 1] == WETH, "Last pair have to be WETH");
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "To much amount required");
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            UniswapV2Library.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        for (uint256 i; i < path.length - 1; ++i) {
            (address input, address output) = UniswapV2Library.sortTokens(path[i], path[i + 1]);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == path[i]
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address pair = UniswapV2Library.pairFor(factory, path[i], path[i + 1]);
            address destination = i < path.length - 2
                ? UniswapV2Library.pairFor(factory, path[i + 1], path[i + 2])
                : address(this);
            IUniswapV2Pair(pair).swap(amount0Out, amount1Out, destination, new bytes(0));
        }
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
        emit SwapTokensForExactETH(amounts[0], amountOut);
    }

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual override returns (uint256 amountA, uint256 amountB) {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        uint256 value = approveMax ? 2**256 - 1 : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }

    function removeLiquidityETHWithPermit(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual override returns (uint256 amountToken, uint256 amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        uint256 value = approveMax ? uint256(-1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountETH) = removeLiquidityETH(token, liquidity, amountTokenMin, amountETHMin, to, deadline);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {
        // check path
        // get amounts
        // transfer to first pair
        // swap
        // trasnfer ETH

        require(path[path.length - 1] == WETH, "Incorrect path");
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Output amount is less than min");
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            UniswapV2Library.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        for (uint256 i; i < path.length - 1; ++i) {
            (address token1, address token2) = UniswapV2Library.sortTokens(path[i], path[i + 1]);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = token1 == path[i]
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address destination = i < path.length - 2
                ? UniswapV2Library.pairFor(factory, path[i + 1], path[i + 2])
                : address(this);
            IUniswapV2Pair(UniswapV2Library.pairFor(factory, token1, token2)).swap(
                amount0Out,
                amount1Out,
                destination,
                new bytes(0)
            );
        }
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
        emit SwapExactTokensForETH(amountIn, amounts[amounts.length - 1]);
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable virtual override returns (uint256[] memory amounts) {
        // check path[0]
        // amounts
        // cehck amount
        // transfer to first pair
        // swap
        //return remaining eth
        require(path[0] == WETH, "Incorrect path");
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, "Required input is less than msg.value");
        IWETH(WETH).deposit{ value: amounts[0] }();
        IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, WETH, path[1]), amounts[0]);

        for (uint256 i; i < path.length - 1; ++i) {
            (address token1, address token2) = UniswapV2Library.sortTokens(path[i], path[i + 1]);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = token1 == path[i]
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address destination = i < path.length - 2
                ? UniswapV2Library.pairFor(factory, path[i + 1], path[i + 2])
                : to;
            IUniswapV2Pair(UniswapV2Library.pairFor(factory, token1, token2)).swap(
                amount0Out,
                amount1Out,
                destination,
                new bytes(0)
            );
        }

        if (amounts[0] < msg.value) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);

        emit SwapETHForExactTokens(amounts[0], amountOut);
    }

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external pure virtual override returns (uint256 amountB) {}

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure virtual override returns (uint256 amountOut) {}

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure virtual override returns (uint256 amountIn) {}

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        virtual
        override
        returns (uint256[] memory amounts)
    {}

    function getAmountsIn(uint256 amountOut, address[] calldata path)
        external
        view
        virtual
        override
        returns (uint256[] memory amounts)
    {}

    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256 amountETH) {}

    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual override returns (uint256 amountETH) {}

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override {}

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable virtual override {}

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override {}

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
    }
}
