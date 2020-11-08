export default function formateDate(value, type) {
    const day = new Date(value).getDate();
    const month = new Date(value).toLocaleString("en", {
      month: type
    });

    return `${day} ${month}`;
  };