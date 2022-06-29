// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@uniswap/v2-periphery/contracts/libraries/SafeMath.sol";

contract BogdanRouter is IUniswapV2Router02 {
    address public override factory;
    address public override WETH;

    event Liquidity(uint256);
    event RemoveLiquidity(address, uint256, uint256);
    event SwapExactToTokens(address, address);
    event SwapTokensToExact(address, address);

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
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);

        if (pair == address(0)) {
            pair = IUniswapV2Factory(factory).createPair(tokenA, tokenB);
        }

        (uint256 reserveA, uint256 reserveB) = UniswapV2Library.getReserves(factory, tokenA, tokenB);

        uint256 requiredAmountB = UniswapV2Library.quote(amountADesired, reserveA, reserveB);

        if (requiredAmountB < amountBMin) {
            uint256 requiredAmountA = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);

            require(requiredAmountA >= amountAMin, "Required amount of token A is lower than min amount");
            require(requiredAmountA <= amountADesired, "Required amount of token A is greater than desired amount");

            // TransferHelper.safeTransferFrom(tokenA, pair, to, requiredAmountA);
            // TransferHelper.safeTransferFrom(tokenB, pair, to, amountBDesired);

            // IERC20(_tokenA).transferFrom(_to, pair, requiredAmountA);
            // IERC20(_tokenB).transferFrom(_to, pair, _amountBDesired);
        } else {
            require(requiredAmountB <= amountBDesired, "required amount is greater than desired amount of B");
            // IERC20(tokenB).transferFrom(to, pair, requiredAmountB);
            // IERC20(tokenA).transferFrom(to, pair, amountADesired);
        }

        emit Liquidity(liquidity);
        liquidity = IUniswapV2Pair(pair).mint(msg.sender);
    }

    function addLiquidityETH(
        address _token,
        uint256 _amountTokenDesired,
        uint256 _amountTokenMin,
        uint256 _amountETHMin,
        address _to,
        uint256 _deadline
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
        // desired eth is msg.value

        address pair = IUniswapV2Factory(factory).getPair(_token, WETH);

        if (pair == address(0)) {
            pair = IUniswapV2Factory(factory).createPair(_token, WETH);
        }

        (uint256 reserve, uint256 reserveWETH) = UniswapV2Library.getReserves(factory, _token, WETH);
        uint256 requiredWETH = UniswapV2Library.quote(_amountTokenDesired, reserve, reserveWETH);
        if (requiredWETH < _amountETHMin) {
            uint256 requiredToken = UniswapV2Library.quote(msg.value, reserveWETH, reserve);
            require(requiredToken >= _amountTokenMin, "Required amount of token is less than min expected");
            require(requiredToken <= _amountTokenDesired, "Required amount of token is less than min expected");

            IERC20(_token).transferFrom(_to, pair, requiredToken);
            payable(pair).transfer(msg.value);
        } else {
            require(requiredWETH <= msg.value, "Required eth is greater than the amount sent");

            IERC20(_token).transferFrom(_to, pair, _amountTokenDesired);

            payable(pair).transfer(requiredWETH);

            uint256 restEth = msg.value - requiredWETH;

            payable(_to).transfer(restEth);
            // how to send the rest back ? like this?
        }
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256 amountA, uint256 amountB) {
        // se da burn la liquidity tokens si se elibereaza tokens
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "the pair doesn't exist");
        IUniswapV2Pair(pair).transferFrom(to, pair, liquidity);
        (uint256 amountA, uint256 amountB) = IUniswapV2Pair(pair).burn(to);
        require(amountA >= amountAMin, "low returned amount on token A");
        require(amountB >= amountBMin, "low returned amount on token B");
        IERC20(tokenA).transferFrom(pair, to, amountA);
        IERC20(tokenB).transferFrom(pair, to, amountB);
        emit RemoveLiquidity(to, amountA, amountB);
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256 amountToken, uint256 amountETH) {
        // se da burn la liquidity tokens si se elibereaza tokens
        address pair = IUniswapV2Factory(factory).getPair(token, WETH);
        require(pair != address(0), "the pair doesn't exist");
        IUniswapV2Pair(pair).transferFrom(to, pair, liquidity);
        (uint256 amountA, uint256 amountB) = IUniswapV2Pair(pair).burn(to);
        require(amountA >= amountTokenMin, "low returned amount on token A");
        require(amountB >= amountETHMin, "low returned amount on token B");
        IERC20(token).transferFrom(pair, to, amountA);
        IWETH(WETH).withdraw(amountB);
        payable(to).transfer(amountB);
        emit RemoveLiquidity(to, amountA, amountB);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {
        address inputToken = path[0];
        address outputToken = path[path.length - 1];
        address pair = IUniswapV2Factory(factory).getPair(inputToken, outputToken);
        if (pair == address(0) && path.length != 2) {
            // nu exista pereche directa
            // get all the amounts from path
            uint256[] memory amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);

            require(amounts[amounts.length - 1] >= amountOutMin, "Output amount is lower than min output amount");

            // swap intre tokeni
            for (uint256 i; i < path.length - 1; i++) {
                address tempPair = IUniswapV2Factory(factory).getPair(path[i], path[i + 1]);
                require(tempPair != address(0), "Inexistent pair");
                IUniswapV2Pair(path[i]).swap(amounts[i], amounts[i + 1], to, new bytes(0));
            }
        } else {
            (uint256 reserveInput, uint256 reserveOutput) = UniswapV2Library.getReserves(
                factory,
                inputToken,
                outputToken
            );
            uint256 amount = UniswapV2Library.getAmountOut(amountIn, reserveInput, reserveOutput);
            IUniswapV2Pair(pair).swap(amountIn, amount, to, new bytes(0));
        }
        emit SwapExactToTokens(inputToken, outputToken);
    }

    // function swapExactETHForTokens(
    //     uint256 amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint256 deadline
    // ) external payable returns (uint256[] memory amounts) {
    //     require(path[0] == WETH, "wrong input token for eth");
    //     address inputToken = path[0];
    //     address outputToken = path[path.lenght - 1];

    //     address pair = IUniswapV2Factory(factory).getPair(inputToken, outputToken);

    //     IWETH(WETH).deposit{ value: msg.value }();

    //     if (pair == address(0) && path.lenght != 2) {
    //         // nu exista pereche directa
    //         // get all the amounts from path
    //         uint256[] memory amounts = UniswapV2Library.getAmountsOut(factory, msg.value, path);

    //         require(amounts[amounts.lenght - 1] >= amountOutMin, "Output amount is lower than min output amount");

    //         // swap intre tokeni
    //         for (uint256 i; i < path.lenght - 1; i++) {
    //             address tempPair = IUniswapV2Factory(factory).getPair(path[i], path[i + 1]);
    //             require(tempPair != address(0), "Inexistent pair");
    //             IUniswapV2Pair(path[i]).swap(amounts[i], amounts[i + 1], to, new bytes(0));
    //         }
    //     } else {
    //         (uint256 reserveInput, uint256 reserveOutput) = UniswapV2Library.getReserves(
    //             factory,
    //             inputToken,
    //             outputToken
    //         );
    //         uint256 amount = UniswapV2Library.getAmountOut(amountIn, reserveInput, reserveOutput);
    //         IUniswapV2Pair(path[i]).swap(amountIn, amount, to, new bytes(0));
    //     }
    //     emit SwapExactToTokens(inputToken, outputToken);
    // }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {
        address outputToken = path[0];
        address inputToken = path[path.length - 1];
        address pair = IUniswapV2Factory(factory).getPair(inputToken, outputToken);
        if (pair == address(0) && path.length != 2) {
            uint256[] memory amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);

            require(amounts[amounts.length - 1] >= amountInMax, "Input amount is lower than min input amount");

            for (uint256 i; i < path.length - 1; i++) {
                address tempPair = IUniswapV2Factory(factory).getPair(path[i], path[i + 1]);
                require(tempPair != address(0), "Inexistent pair");
                IUniswapV2Pair(path[i]).swap(amounts[i], amounts[i + 1], to, new bytes(0));
            }
        } else {
            (uint256 reserveInput, uint256 reserveOutput) = UniswapV2Library.getReserves(
                factory,
                inputToken,
                outputToken
            );
            uint256 amount = UniswapV2Library.getAmountIn(amountOut, reserveInput, reserveOutput);
            IUniswapV2Pair(pair).swap(amountOut, amount, to, new bytes(0));
        }
        emit SwapTokensToExact(inputToken, outputToken);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {
        // cat trebuie sa bag ca sa obtin atata eth
        // require(path[path.length - 1] == WETH, "Last address have to be WETH");
        // uint256[] memory amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path); // last amount este eth amount, first amount este input token
        // require(amounts[0] <= amountInMax, "Amount is greater then max input amount");
        // // move first amountof input token from msg sender to the first pair
        // TransferHelper.safeTransferFrom(path[0], msg.sender, to, value);
        // for (uint256 i; i < path.length - 1; ++i) {
        //     address pair = UniswapV2Library.pairFor(factory, path[i], path[i + 1]);
        //     // need to order them to know the what amount is for what token in swap
        //     uint256 amountOut = amounts[i + 1];
        //     (address token0, ) = UniswapV2Library.sortTokens(path[i], path[i + 1]);
        //     (uint256 amount0Out, uint256 amount1Out) = token0 == path[i]
        //         ? (uint256(0), amountOut)
        //         : (amountOut, uint256(0));
        //     address destination = i < path.length - 2 ? pair : to;
        //     IUniswapV2Pair(pair).swap(amount0Out, amount1Out, destination, new bytes(0));
        // }
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
    ) external virtual override returns (uint256 amountA, uint256 amountB) {}

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
    ) external virtual override returns (uint256 amountToken, uint256 amountETH) {}

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable virtual override returns (uint256[] memory amounts) {}

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual override returns (uint256[] memory amounts) {}

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable virtual override returns (uint256[] memory amounts) {}

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
}
