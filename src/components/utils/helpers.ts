export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };
  
  export const getDepartmentName = (code: string): string => {
    const departments: Record<string, string> = {
      CS: "Computer Science",
      IT: "Information Technology",
      ENTC: "Electronics & Telecom",
      MECH: "Mechanical",
      CIVIL: "Civil",
      ELECTRICAL: "Electrical",
    };
    return departments[code] || code;
  };
  
  export const getYearName = (code: string): string => {
    const years: Record<string, string> = {
      FE: "First Year",
      SE: "Second Year",
      TE: "Third Year",
      BE: "Final Year",
    };
    return years[code] || code;
  };