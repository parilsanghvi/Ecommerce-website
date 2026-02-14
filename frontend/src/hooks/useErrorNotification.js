import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";

const useErrorNotification = (error, clearAction) => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearAction());
        }
    }, [error, dispatch, enqueueSnackbar, clearAction]);
};

export default useErrorNotification;
